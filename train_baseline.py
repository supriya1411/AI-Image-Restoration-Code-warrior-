"""
train_baseline.py

Stage 5: Train the simple baseline CNN.

Dataset:
    C:/Users/balam/Desktop/train

Train/Validation:
    2800 / 400 pairs

Input:
    NoisyLR -> (B, 1, 128, 128)

Target:
    GT -> (B, 1, 256, 256)
"""

import os
import torch
import torch.nn as nn
from torch.optim import Adam

from src.data_split import build_dataloaders
from src.baseline_model import BaselineCNN


# --------------------------------------------------
# Configuration
# --------------------------------------------------

DATA_ROOT = r"C:\Users\balam\Desktop\train"

BATCH_SIZE = 16
EPOCHS = 10
LEARNING_RATE = 1e-4
SEED = 42

CHECKPOINT_DIR = "weights"
BEST_MODEL_PATH = os.path.join(
    CHECKPOINT_DIR,
    "baseline_best.pth"
)


# --------------------------------------------------
# Reproducibility
# --------------------------------------------------

torch.manual_seed(SEED)

if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)


# --------------------------------------------------
# Device
# --------------------------------------------------

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print(f"Device: {device}")

if device.type == "cuda":
    print(f"GPU: {torch.cuda.get_device_name(0)}")


# --------------------------------------------------
# Data
# --------------------------------------------------

print("\nLoading dataset...")

train_loader, val_loader, train_ds, val_ds = build_dataloaders(
    DATA_ROOT,
    batch_size=BATCH_SIZE,
    val_fraction=0.125,
    seed=SEED,
    num_workers=0
)

print(f"Train samples: {len(train_ds)}")
print(f"Validation samples: {len(val_ds)}")


# --------------------------------------------------
# Model
# --------------------------------------------------

model = BaselineCNN().to(device)

print("\nBaseline model created.")


# --------------------------------------------------
# Loss + Optimizer
# --------------------------------------------------

criterion = nn.L1Loss()

optimizer = Adam(
    model.parameters(),
    lr=LEARNING_RATE
)


# --------------------------------------------------
# Checkpoint directory
# --------------------------------------------------

os.makedirs(CHECKPOINT_DIR, exist_ok=True)

best_val_loss = float("inf")


# --------------------------------------------------
# Training
# --------------------------------------------------

print("\nStarting baseline training...\n")

for epoch in range(1, EPOCHS + 1):

    # -----------------------------
    # Training
    # -----------------------------

    model.train()

    train_loss = 0.0

    for batch_idx, (lr, gt, names) in enumerate(train_loader):

        lr = lr.to(device, non_blocking=True)
        gt = gt.to(device, non_blocking=True)

        optimizer.zero_grad()

        restored = model(lr)

        loss = criterion(restored, gt)

        loss.backward()

        optimizer.step()

        train_loss += loss.item()

        if (batch_idx + 1) % 25 == 0:
            print(
                f"Epoch [{epoch}/{EPOCHS}] "
                f"Batch [{batch_idx + 1}/{len(train_loader)}] "
                f"Loss: {loss.item():.6f}"
            )

    train_loss /= len(train_loader)


    # -----------------------------
    # Validation
    # -----------------------------

    model.eval()

    val_loss = 0.0

    with torch.no_grad():

        for lr, gt, names in val_loader:

            lr = lr.to(device, non_blocking=True)
            gt = gt.to(device, non_blocking=True)

            restored = model(lr)

            loss = criterion(restored, gt)

            val_loss += loss.item()

    val_loss /= len(val_loader)


    # -----------------------------
    # Epoch results
    # -----------------------------

    print(
        f"\nEpoch {epoch}/{EPOCHS} "
        f"| Train Loss: {train_loss:.6f} "
        f"| Val Loss: {val_loss:.6f}"
    )


    # -----------------------------
    # Save best checkpoint
    # -----------------------------

    if val_loss < best_val_loss:

        best_val_loss = val_loss

        torch.save(
            {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "train_loss": train_loss,
                "val_loss": val_loss,
            },
            BEST_MODEL_PATH
        )

        print(
            f"✓ Best model saved → {BEST_MODEL_PATH}"
        )


print("\nBaseline training complete.")
print(f"Best validation loss: {best_val_loss:.6f}")
print(f"Best checkpoint: {BEST_MODEL_PATH}")