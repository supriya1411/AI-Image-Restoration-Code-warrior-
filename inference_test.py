import os
import numpy as np
import torch
import matplotlib.pyplot as plt

from src.darc_net import DARCNet


# ============================================================
# Configuration
# ============================================================

INPUT_PATH = r"test_samples\000009.npy"
CHECKPOINT = r"weights\darc_losses_best.pth"
OUTPUT_DIR = r"inference_results"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# Device
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Device:", device)

if device.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))


# ============================================================
# Load model
# ============================================================

print("\nLoading DARC-Net...")

model = DARCNet().to(device)

checkpoint = torch.load(
    CHECKPOINT,
    map_location=device,
    weights_only=False
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.eval()

print("DARC-Net loaded.")
print("Checkpoint:", CHECKPOINT)
print("Checkpoint epoch:", checkpoint["epoch"])


# ============================================================
# Load REAL TEST NoisyLR
# ============================================================

lr_array = np.load(INPUT_PATH)

print("\nTest Input:")
print("Filename:", INPUT_PATH)
print("Shape:", lr_array.shape)
print("Dtype:", lr_array.dtype)
print(
    f"Range: {lr_array.min():.6f} "
    f"to {lr_array.max():.6f}"
)


# ============================================================
# Convert numpy → PyTorch
# ============================================================

lr_tensor = torch.from_numpy(
    lr_array
).float()

# (128,128)
#      ↓
# (1,1,128,128)

lr_tensor = lr_tensor.unsqueeze(0).unsqueeze(0)
lr_tensor = lr_tensor.to(device)


# ============================================================
# DARC-Net inference
# ============================================================

print("\nRunning DARC-Net inference...")

with torch.no_grad():
    restored = model(lr_tensor)


# ============================================================
# Convert output → numpy
# ============================================================

restored_array = (
    restored[0, 0]
    .cpu()
    .numpy()
)

print("\nRestored Output:")
print("Shape:", restored_array.shape)
print(
    f"Raw range: {restored_array.min():.6f} "
    f"to {restored_array.max():.6f}"
)


# ============================================================
# Visualization
# ============================================================

input_display = np.clip(
    lr_array,
    0.0,
    1.0
)

restored_display = np.clip(
    restored_array,
    0.0,
    1.0
)


fig, axes = plt.subplots(
    1,
    2,
    figsize=(10, 5)
)


axes[0].imshow(
    input_display,
    cmap="gray"
)

axes[0].set_title(
    "REAL TEST - NoisyLR"
)


axes[1].imshow(
    restored_display,
    cmap="gray"
)

axes[1].set_title(
    "DARC-Net Restoration"
)


for ax in axes:
    ax.axis("off")


fig.suptitle(
    "KLA Test Sample - 000009.npy"
)

plt.tight_layout()


# ============================================================
# Save comparison
# ============================================================

comparison_path = os.path.join(
    OUTPUT_DIR,
    "000009_test_comparison.png"
)

plt.savefig(
    comparison_path,
    dpi=150,
    bbox_inches="tight"
)

plt.close(fig)


# ============================================================
# Save restored NPY
# ============================================================

restored_npy_path = os.path.join(
    OUTPUT_DIR,
    "000009_restored.npy"
)

np.save(
    restored_npy_path,
    restored_array
)


# ============================================================
# Complete
# ============================================================

print("\n=============================================")
print("REAL TEST INFERENCE COMPLETE")
print("=============================================")

print("Input:", INPUT_PATH)

print(
    "Restored shape:",
    restored_array.shape
)

print(
    "Comparison image:",
    comparison_path
)

print(
    "Restored NPY:",
    restored_npy_path
)

print("=============================================")