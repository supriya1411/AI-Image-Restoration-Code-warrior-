import os
import torch
import torch.nn as nn
from src.data_split import build_dataloaders
from src.darc_net import DARCNet


# =========================
# Configuration
# =========================

DATA_ROOT = r"C:\Users\balam\Desktop\train"

BATCH_SIZE = 4
EPOCHS = 10
LEARNING_RATE = 2e-4

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

os.makedirs("weights", exist_ok=True)


# =========================
# Setup
# =========================

print("Device:", DEVICE)

if DEVICE.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))

print("\nLoading dataset...")

train_loader, val_loader, train_ds, val_ds = build_dataloaders(
    DATA_ROOT,
    batch_size=BATCH_SIZE,
    val_fraction=0.125,
    seed=42,
    num_workers=0,
)

print("Train samples:", len(train_ds))
print("Validation samples:", len(val_ds))


# =========================
# Model
# =========================

model = DARCNet().to(DEVICE)

print("\nDARC-Net created.")

parameters = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Trainable parameters: {parameters:,}")


# =========================
# Loss + Optimizer
# =========================

criterion = nn.L1Loss()

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=1e-4,
)


# =========================
# Training
# =========================

best_val_loss = float("inf")

print("\nStarting DARC-Net training...\n")

for epoch in range(1, EPOCHS + 1):

    # ---------------------
    # Training
    # ---------------------

    model.train()

    running_train_loss = 0.0

    for batch_idx, (lr, gt, names) in enumerate(train_loader, start=1):

        lr = lr.to(DEVICE, non_blocking=True)
        gt = gt.to(DEVICE, non_blocking=True)

        optimizer.zero_grad()

        output = model(lr)

        loss = criterion(output, gt)

        loss.backward()

        optimizer.step()

        running_train_loss += loss.item()

        if batch_idx % 25 == 0 or batch_idx == len(train_loader):
            print(
                f"Epoch [{epoch}/{EPOCHS}] "
                f"Batch [{batch_idx}/{len(train_loader)}] "
                f"Loss: {loss.item():.6f}"
            )

    train_loss = running_train_loss / len(train_loader)


    # ---------------------
    # Validation
    # ---------------------

    model.eval()

    running_val_loss = 0.0

    with torch.no_grad():

        for lr, gt, names in val_loader:

            lr = lr.to(DEVICE, non_blocking=True)
            gt = gt.to(DEVICE, non_blocking=True)

            output = model(lr)

            loss = criterion(output, gt)

            running_val_loss += loss.item()

    val_loss = running_val_loss / len(val_loader)


    print(
        f"\nEpoch {epoch}/{EPOCHS} "
        f"| Train Loss: {train_loss:.6f} "
        f"| Val Loss: {val_loss:.6f}"
    )


    # ---------------------
    # Save best checkpoint
    # ---------------------

    if val_loss < best_val_loss:

        best_val_loss = val_loss

        checkpoint_path = "weights/darc_best.pth"

        torch.save(
            {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "train_loss": train_loss,
                "val_loss": val_loss,
            },
            checkpoint_path,
        )

        print(f"✓ Best DARC-Net saved → {checkpoint_path}")


print("\n=============================================")
print("DARC-NET TRAINING COMPLETE")
print("=============================================")
print(f"Best validation loss: {best_val_loss:.6f}")
print("Best checkpoint: weights/darc_best.pth")
print("=============================================")