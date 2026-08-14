"""
evaluate_baseline.py

Stage 6: Evaluate the trained baseline model.

Uses:
    400 validation images

Reports:
    PSNR
    SSIM
    LPIPS
"""

import os
import torch

from src.data_split import build_dataloaders
from src.baseline_model import BaselineCNN
from src.metrics import RestorationMetrics


# --------------------------------------------------
# Configuration
# --------------------------------------------------

DATA_ROOT = r"C:\Users\balam\Desktop\train"

CHECKPOINT_PATH = r"weights\baseline_best.pth"

BATCH_SIZE = 16
SEED = 42


# --------------------------------------------------
# Device
# --------------------------------------------------

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print(f"Device: {device}")

if device.type == "cuda":
    print(
        f"GPU: {torch.cuda.get_device_name(0)}"
    )


# --------------------------------------------------
# Validation DataLoader
# --------------------------------------------------

print("\nLoading validation dataset...")

_, val_loader, _, val_ds = build_dataloaders(
    DATA_ROOT,
    batch_size=BATCH_SIZE,
    val_fraction=0.125,
    seed=SEED,
    num_workers=0
)

print(f"Validation samples: {len(val_ds)}")


# --------------------------------------------------
# Model
# --------------------------------------------------

print("\nLoading baseline checkpoint...")

model = BaselineCNN().to(device)

checkpoint = torch.load(
    CHECKPOINT_PATH,
    map_location=device
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.eval()

print(
    f"Loaded checkpoint from epoch "
    f"{checkpoint['epoch']}"
)


# --------------------------------------------------
# Metrics
# --------------------------------------------------

metrics = RestorationMetrics(device)


# --------------------------------------------------
# Evaluation
# --------------------------------------------------

print("\nEvaluating baseline...\n")

with torch.no_grad():

    for batch_idx, (lr, gt, names) in enumerate(val_loader):

        lr = lr.to(device)
        gt = gt.to(device)

        restored = model(lr)

        metrics.update(
            restored,
            gt
        )

        if (batch_idx + 1) % 10 == 0:
            print(
                f"Processed "
                f"{batch_idx + 1}/{len(val_loader)} batches"
            )


# --------------------------------------------------
# Results
# --------------------------------------------------

results = metrics.compute()

print("\n" + "=" * 45)
print("BASELINE EVALUATION RESULTS")
print("=" * 45)

print(
    f"PSNR  : {results['PSNR']:.4f} dB"
)

print(
    f"SSIM  : {results['SSIM']:.4f}"
)

print(
    f"LPIPS : {results['LPIPS']:.4f}"
)

print("=" * 45)

print("\nHigher PSNR  = better")
print("Higher SSIM  = better")
print("Lower LPIPS  = better")