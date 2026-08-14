"""
visualize_baseline.py

Stage 6: Visual comparison of baseline restoration.

For selected validation images, saves:
    NoisyLR | Baseline Output | GT

Output folder:
    visual_results/baseline/
"""

import os

import numpy as np
import torch
import matplotlib.pyplot as plt

from src.data_split import build_dataloaders
from src.baseline_model import BaselineCNN


# --------------------------------------------------
# Configuration
# --------------------------------------------------

DATA_ROOT = r"C:\Users\balam\Desktop\train"
CHECKPOINT_PATH = r"weights\baseline_best.pth"

BATCH_SIZE = 16
SEED = 42

OUTPUT_DIR = r"visual_results\baseline"

NUM_IMAGES = 10


# --------------------------------------------------
# Device
# --------------------------------------------------

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print(f"Device: {device}")


# --------------------------------------------------
# Validation Data
# --------------------------------------------------

_, val_loader, _, val_ds = build_dataloaders(
    DATA_ROOT,
    batch_size=BATCH_SIZE,
    val_fraction=0.125,
    seed=SEED,
    num_workers=0
)

print(f"Validation samples: {len(val_ds)}")


# --------------------------------------------------
# Load model
# --------------------------------------------------

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
    f"Loaded baseline checkpoint "
    f"from epoch {checkpoint['epoch']}"
)


# --------------------------------------------------
# Create output directory
# --------------------------------------------------

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# --------------------------------------------------
# Generate visual results
# --------------------------------------------------

saved = 0

with torch.no_grad():

    for lr, gt, names in val_loader:

        lr = lr.to(device)
        gt = gt.to(device)

        restored = model(lr)

        for i in range(lr.shape[0]):

            if saved >= NUM_IMAGES:
                break

            # Convert tensors to numpy
            lr_img = lr[i, 0].cpu().numpy()

            restored_img = restored[i, 0].cpu().numpy()

            gt_img = gt[i, 0].cpu().numpy()

            # Clamp only for visualization
            lr_display = np.clip(lr_img, 0.0, 1.0)
            restored_display = np.clip(
                restored_img,
                0.0,
                1.0
            )
            gt_display = np.clip(
                gt_img,
                0.0,
                1.0
            )

            # Create comparison figure
            fig, axes = plt.subplots(
                1,
                3,
                figsize=(12, 4)
            )

            axes[0].imshow(
                lr_display,
                cmap="gray"
            )
            axes[0].set_title("NoisyLR")

            axes[1].imshow(
                restored_display,
                cmap="gray"
            )
            axes[1].set_title("Baseline Output")

            axes[2].imshow(
                gt_display,
                cmap="gray"
            )
            axes[2].set_title("Ground Truth")

            for ax in axes:
                ax.axis("off")

            fig.suptitle(
                f"Baseline Restoration - {names[i]}"
            )

            output_path = os.path.join(
                OUTPUT_DIR,
                f"{saved + 1:02d}_{names[i].replace('.npy', '.png')}"
            )

            plt.tight_layout()

            plt.savefig(
                output_path,
                dpi=150,
                bbox_inches="tight"
            )

            plt.close(fig)

            print(
                f"Saved: {output_path}"
            )

            saved += 1

        if saved >= NUM_IMAGES:
            break


print(
    f"\nVisual evaluation complete."
)
print(
    f"Saved {saved} comparison images to "
    f"{OUTPUT_DIR}"
)