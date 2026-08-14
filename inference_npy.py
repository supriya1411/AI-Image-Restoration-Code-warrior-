import os

import numpy as np
import torch
import matplotlib.pyplot as plt

from src.darc_net import DARCNet


# ============================================================
# Configuration
# ============================================================

DATA_ROOT = r"C:\Users\balam\Desktop\train"

# Leading candidate: DARC-Net + Combined Loss
CHECKPOINT = r"weights\darc_losses_best.pth"

# Change this to any real validation filename
INPUT_NAME = "000000.npy"

OUTPUT_DIR = r"inference_results"


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
# Paths
# ============================================================

input_path = os.path.join(
    DATA_ROOT,
    "NoisyLR",
    INPUT_NAME
)

gt_path = os.path.join(
    DATA_ROOT,
    "GT",
    INPUT_NAME
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# Load model
# ============================================================

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

print("\nLoaded checkpoint:")
print(CHECKPOINT)

print("Checkpoint epoch:", checkpoint["epoch"])


# ============================================================
# Load real NoisyLR
# ============================================================

lr_array = np.load(input_path)

print("\nInput:")
print("Filename:", INPUT_NAME)
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
#     ↓
# (1,128,128)
lr_tensor = lr_tensor.unsqueeze(0)

# (1,128,128)
#     ↓
# (1,1,128,128)
lr_tensor = lr_tensor.unsqueeze(0)

lr_tensor = lr_tensor.to(device)


# ============================================================
# DARC-Net inference
# ============================================================

print("\nRunning DARC-Net inference...")

with torch.no_grad():

    restored = model(
        lr_tensor
    )


# ============================================================
# Convert output back to numpy
# ============================================================

restored_array = (
    restored[0, 0]
    .cpu()
    .numpy()
)

print("\nOutput:")
print("Shape:", restored_array.shape)
print(
    f"Raw range: {restored_array.min():.6f} "
    f"to {restored_array.max():.6f}"
)


# ============================================================
# Visualization
# ============================================================

lr_display = np.clip(
    lr_array,
    0.0,
    1.0
)

restored_display = np.clip(
    restored_array,
    0.0,
    1.0
)


# Load GT only for comparison.
# GT is NOT used by the model.
gt_array = np.load(gt_path)

gt_display = np.clip(
    gt_array,
    0.0,
    1.0
)


fig, axes = plt.subplots(
    1,
    3,
    figsize=(12, 4)
)


axes[0].imshow(
    lr_display,
    cmap="gray"
)

axes[0].set_title(
    "NoisyLR Input"
)


axes[1].imshow(
    restored_display,
    cmap="gray"
)

axes[1].set_title(
    "DARC-Net Restoration"
)


axes[2].imshow(
    gt_display,
    cmap="gray"
)

axes[2].set_title(
    "Ground Truth"
)


for ax in axes:
    ax.axis("off")


fig.suptitle(
    f"Inference Test - {INPUT_NAME}"
)

plt.tight_layout()


output_path = os.path.join(
    OUTPUT_DIR,
    INPUT_NAME.replace(
        ".npy",
        "_inference.png"
    )
)

plt.savefig(
    output_path,
    dpi=150,
    bbox_inches="tight"
)

plt.close(fig)


# ============================================================
# Save restored image as NPY
# ============================================================

restored_npy_path = os.path.join(
    OUTPUT_DIR,
    INPUT_NAME.replace(
        ".npy",
        "_restored.npy"
    )
)

np.save(
    restored_npy_path,
    restored_array
)


# ============================================================
# Complete
# ============================================================

print("\n=============================================")
print("INFERENCE TEST COMPLETE")
print("=============================================")

print(
    "Restored shape:",
    restored_array.shape
)

print(
    "Comparison image:",
    output_path
)

print(
    "Restored NPY:",
    restored_npy_path
)

print("=============================================")