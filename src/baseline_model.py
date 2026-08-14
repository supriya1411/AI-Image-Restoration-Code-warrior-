"""
src/baseline_model.py

Stage 4: Simple baseline CNN for KLA image restoration.

Input:
    NoisyLR -> (B, 1, 128, 128)

Output:
    Restored HR image -> (B, 1, 256, 256)

Purpose:
    This is a simple baseline model. We will train and evaluate it first,
    then compare DARC-Net against its results.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class BaselineCNN(nn.Module):
    """
    Simple CNN baseline for 2x microscopy image restoration.

    The model:
        1. Extracts features from the 128x128 input.
        2. Processes those features using convolution layers.
        3. Upsamples by 2x.
        4. Produces a single-channel 256x256 restored image.
    """

    def __init__(self, features: int = 64):
        super().__init__()

        # Feature extraction
        self.conv1 = nn.Conv2d(
            in_channels=1,
            out_channels=features,
            kernel_size=3,
            padding=1
        )

        self.conv2 = nn.Conv2d(
            in_channels=features,
            out_channels=features,
            kernel_size=3,
            padding=1
        )

        self.conv3 = nn.Conv2d(
            in_channels=features,
            out_channels=features,
            kernel_size=3,
            padding=1
        )

        # Reconstruction after upsampling
        self.conv4 = nn.Conv2d(
            in_channels=features,
            out_channels=features,
            kernel_size=3,
            padding=1
        )

        self.output_conv = nn.Conv2d(
            in_channels=features,
            out_channels=1,
            kernel_size=3,
            padding=1
        )

    def forward(self, x):
        # 128x128 feature extraction
        x = F.gelu(self.conv1(x))
        x = F.gelu(self.conv2(x))
        x = F.gelu(self.conv3(x))

        # 2x spatial upsampling:
        # 128x128 -> 256x256
        x = F.interpolate(
            x,
            scale_factor=2,
            mode="bilinear",
            align_corners=False
        )

        # HR reconstruction
        x = F.gelu(self.conv4(x))
        x = self.output_conv(x)

        return x


if __name__ == "__main__":
    # Simple forward-pass smoke test.
    # This does NOT train the model.

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    model = BaselineCNN().to(device)

    # Same shape as one batch from our DataLoader
    dummy_input = torch.randn(
        16, 1, 128, 128,
        device=device
    )

    output = model(dummy_input)

    print(f"Device: {device}")
    print(f"Input shape:  {tuple(dummy_input.shape)}")
    print(f"Output shape: {tuple(output.shape)}")

    # Verify expected output dimensions
    assert output.shape == (16, 1, 256, 256)

    print("Baseline forward pass: SUCCESS")