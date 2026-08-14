"""
src/metrics.py

Stage 6: Image restoration evaluation metrics.

Metrics:
    PSNR  -> higher is better
    SSIM  -> higher is better
    LPIPS -> lower is better
"""

import torch
from torchmetrics.image import PeakSignalNoiseRatio
from torchmetrics.image import StructuralSimilarityIndexMeasure
from torchmetrics.image.lpip import LearnedPerceptualImagePatchSimilarity


class RestorationMetrics:
    def __init__(self, device):
        self.device = device

        self.psnr = PeakSignalNoiseRatio(
            data_range=1.0
        ).to(device)

        self.ssim = StructuralSimilarityIndexMeasure(
            data_range=1.0
        ).to(device)

        self.lpips = LearnedPerceptualImagePatchSimilarity(
            net_type="alex"
        ).to(device)

    def update(self, prediction, target):
        """
        prediction and target:
            (B, 1, 256, 256)

        GT is [0,1].
        """

        # PSNR and SSIM expect values in [0,1].
        prediction = torch.clamp(prediction, 0.0, 1.0)
        target = torch.clamp(target, 0.0, 1.0)

        self.psnr.update(prediction, target)
        self.ssim.update(prediction, target)

        # LPIPS expects 3-channel images in [-1, 1].
        prediction_lpips = prediction.repeat(1, 3, 1, 1)
        target_lpips = target.repeat(1, 3, 1, 1)

        prediction_lpips = prediction_lpips * 2.0 - 1.0
        target_lpips = target_lpips * 2.0 - 1.0

        self.lpips.update(
            prediction_lpips,
            target_lpips
        )

    def compute(self):
        return {
            "PSNR": self.psnr.compute().item(),
            "SSIM": self.ssim.compute().item(),
            "LPIPS": self.lpips.compute().item(),
        }