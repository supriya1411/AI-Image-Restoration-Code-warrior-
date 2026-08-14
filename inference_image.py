"""
inference_image.py

Stage 11B:
Normal PNG/JPG image -> DARC-Net -> restored PNG.

NOTE:
KLA's official benchmark input is NoisyLR .npy data.
This script provides a normal-image demo interface and uses
a documented preprocessing path to match the model's expected
128x128 single-channel input.
"""

import os

import numpy as np
import torch
from PIL import Image

from src.darc_net import DARCNet


# ============================================================
# Configuration
# ============================================================

CHECKPOINT = r"weights\darc_losses_best.pth"

# Put your test image here.
INPUT_IMAGE = r"test_input.png"

OUTPUT_DIR = r"inference_results"

OUTPUT_IMAGE = r"restored_output.png"


# ============================================================
# Device
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Device:", device)

if device.type == "cuda":
    print(
        "GPU:",
        torch.cuda.get_device_name(0)
    )


# ============================================================
# Create output directory
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# Load DARC-Net
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

print(
    "Loaded checkpoint:",
    CHECKPOINT
)

print(
    "Checkpoint epoch:",
    checkpoint["epoch"]
)


# ============================================================
# Load input image
# ============================================================

print("\nLoading input image...")

image = Image.open(
    INPUT_IMAGE
)

print(
    "Original image size:",
    image.size
)

print(
    "Original mode:",
    image.mode
)


# ============================================================
# Convert to grayscale
# ============================================================

image = image.convert("L")


# ============================================================
# Resize to model input size
# ============================================================

image = image.resize(
    (128, 128),
    Image.Resampling.BICUBIC
)


# ============================================================
# Convert image → numpy
# ============================================================

image_array = np.asarray(
    image,
    dtype=np.float32
)


# Convert [0,255] → [0,1]
image_array = image_array / 255.0


print(
    "Model input shape:",
    image_array.shape
)

print(
    f"Model input range: "
    f"{image_array.min():.6f} "
    f"to {image_array.max():.6f}"
)


# ============================================================
# Convert numpy → PyTorch
# ============================================================

input_tensor = torch.from_numpy(
    image_array
).float()

# (128,128)
#     ↓
# (1,128,128)
input_tensor = input_tensor.unsqueeze(0)

# (1,128,128)
#     ↓
# (1,1,128,128)
input_tensor = input_tensor.unsqueeze(0)

input_tensor = input_tensor.to(
    device
)


# ============================================================
# DARC-Net inference
# ============================================================

print("\nRunning DARC-Net...")

with torch.no_grad():

    restored = model(
        input_tensor
    )


# ============================================================
# Convert output → numpy
# ============================================================

restored_array = (
    restored[0, 0]
    .cpu()
    .numpy()
)


print(
    "Restored shape:",
    restored_array.shape
)

print(
    f"Raw output range: "
    f"{restored_array.min():.6f} "
    f"to {restored_array.max():.6f}"
)


# ============================================================
# Clamp output for image saving
# ============================================================

restored_array = np.clip(
    restored_array,
    0.0,
    1.0
)


# ============================================================
# Convert [0,1] → [0,255]
# ============================================================

restored_uint8 = (
    restored_array * 255.0
).round().astype(
    np.uint8
)


# ============================================================
# Save restored image
# ============================================================

output_path = os.path.join(
    OUTPUT_DIR,
    OUTPUT_IMAGE
)

restored_image = Image.fromarray(
    restored_uint8,
    mode="L"
)

restored_image.save(
    output_path
)


# ============================================================
# Complete
# ============================================================

print("\n=============================================")
print("IMAGE INFERENCE COMPLETE")
print("=============================================")

print(
    "Input:",
    INPUT_IMAGE
)

print(
    "Output:",
    output_path
)

print(
    "Output resolution:",
    restored_image.size
)

print("=============================================")