import numpy as np
from PIL import Image

INPUT = r"C:\Users\balam\Desktop\train\NoisyLR\000001.npy"
OUTPUT = r"test_input.png"

# Load KLA NoisyLR
arr = np.load(INPUT).astype(np.float32)

print("Original shape:", arr.shape)
print("Original range:", arr.min(), "to", arr.max())

# Normalize ONLY for PNG visualization.
# This does NOT modify your original .npy.
arr_min = arr.min()
arr_max = arr.max()

arr = (arr - arr_min) / (arr_max - arr_min)

# Convert to 8-bit grayscale
arr_uint8 = (arr * 255).clip(0, 255).astype(np.uint8)

# Save PNG
Image.fromarray(arr_uint8, mode="L").save(OUTPUT)

print("Saved:", OUTPUT)