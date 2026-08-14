import torch

from src.data_split import build_dataloaders
from src.darc_net import DARCNet
from src.metrics import RestorationMetrics


# ============================================================
# Configuration
# ============================================================

DATA_ROOT = r"C:\Users\balam\Desktop\train"

CHECKPOINT = "weights/darc_losses_best.pth"

BATCH_SIZE = 4

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# Setup
# ============================================================

print("Device:", DEVICE)

if DEVICE.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))


print("\nLoading validation dataset...")


# IMPORTANT:
# Exactly the same validation split used for
# baseline and original DARC-Net.
_, val_loader, _, val_ds = build_dataloaders(
    DATA_ROOT,
    batch_size=BATCH_SIZE,
    val_fraction=0.125,
    seed=42,
    num_workers=0,
)


print("Validation samples:", len(val_ds))


# ============================================================
# Create model
# ============================================================

model = DARCNet().to(DEVICE)


# ============================================================
# Load loss-experiment checkpoint
# ============================================================

checkpoint = torch.load(
    CHECKPOINT,
    map_location=DEVICE,
    weights_only=False
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

print("\nLoaded DARC-Net loss-experiment checkpoint.")
print("Checkpoint epoch:", checkpoint["epoch"])
print("Checkpoint validation loss:", checkpoint["val_loss"])


# ============================================================
# Evaluation
# ============================================================

model.eval()

metrics = RestorationMetrics(DEVICE)

print("\nEvaluating DARC-Net + Combined Loss...\n")


with torch.no_grad():

    for batch_idx, (lr, gt, names) in enumerate(
        val_loader,
        start=1
    ):

        lr = lr.to(
            DEVICE,
            non_blocking=True
        )

        gt = gt.to(
            DEVICE,
            non_blocking=True
        )

        # Restoration
        output = model(lr)

        # PSNR / SSIM / LPIPS
        metrics.update(
            output,
            gt
        )

        if (
            batch_idx % 10 == 0
            or batch_idx == len(val_loader)
        ):
            print(
                f"Processed "
                f"{batch_idx}/{len(val_loader)} batches"
            )


# ============================================================
# Results
# ============================================================

results = metrics.compute()


print("\n=============================================")
print("DARC-NET + COMBINED LOSS RESULTS")
print("=============================================")

print(
    f"PSNR  : {results['PSNR']:.4f} dB"
)

print(
    f"SSIM  : {results['SSIM']:.4f}"
)

print(
    f"LPIPS : {results['LPIPS']:.4f}"
)

print("=============================================")

print("\nHigher PSNR  = better")
print("Higher SSIM  = better")
print("Lower LPIPS  = better")


# ============================================================
# Compare with current DARC-Net champion
# ============================================================

print("\n=============================================")
print("CURRENT DARC-NET CHAMPION")
print("=============================================")

print("PSNR  : 25.4513 dB")
print("SSIM  : 0.7631")
print("LPIPS : 0.2972")

print("=============================================")