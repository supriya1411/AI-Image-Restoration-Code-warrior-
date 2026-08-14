"""
src/losses.py

Stage 9A: Loss functions for DARC-Net.

Implemented:
    1. Charbonnier Loss
    2. SSIM Loss
    3. Gradient Loss

Degradation consistency loss will be added separately after
the degradation simulation is defined and tested.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchmetrics.image import StructuralSimilarityIndexMeasure


# ============================================================
# 1. Charbonnier Loss
# ============================================================

class CharbonnierLoss(nn.Module):
    """
    Smooth and robust alternative to L1 loss.

    Formula:
        L = mean(sqrt((prediction - target)^2 + eps^2))
    """

    def __init__(self, eps=1e-3):
        super().__init__()
        self.eps = eps

    def forward(self, prediction, target):
        diff = prediction - target
        loss = torch.sqrt(diff * diff + self.eps * self.eps)

        return loss.mean()


# ============================================================
# 2. SSIM Loss
# ============================================================

class SSIMLoss(nn.Module):
    """
    Structural similarity loss.

    SSIM is higher when images are structurally similar,
    therefore the loss is:

        L_SSIM = 1 - SSIM
    """

    def __init__(self):
        super().__init__()

        self.ssim = StructuralSimilarityIndexMeasure(
            data_range=1.0
        )

    def forward(self, prediction, target):

        # SSIM expects images in [0, 1]
        prediction = torch.clamp(
            prediction,
            0.0,
            1.0
        )

        target = torch.clamp(
            target,
            0.0,
            1.0
        )

        ssim_value = self.ssim(
            prediction,
            target
        )

        return 1.0 - ssim_value


# ============================================================
# 3. Gradient Loss
# ============================================================

class GradientLoss(nn.Module):
    """
    Compares image gradients between prediction and target.

    This encourages the model to preserve edges and fine
    structural details.
    """

    def forward(self, prediction, target):

        # Horizontal gradients
        pred_dx = prediction[:, :, :, 1:] - prediction[:, :, :, :-1]
        target_dx = target[:, :, :, 1:] - target[:, :, :, :-1]

        # Vertical gradients
        pred_dy = prediction[:, :, 1:, :] - prediction[:, :, :-1, :]
        target_dy = target[:, :, 1:, :] - target[:, :, :-1, :]

        loss_x = F.l1_loss(
            pred_dx,
            target_dx
        )

        loss_y = F.l1_loss(
            pred_dy,
            target_dy
        )

        return loss_x + loss_y


# ============================================================
# Combined Stage 9A Loss
# ============================================================

class RestorationLoss(nn.Module):
    """
    Combined restoration loss.

    Stage 9A:

        L =
            L_Charbonnier
            + lambda_ssim * L_SSIM
            + lambda_gradient * L_gradient

    Degradation consistency will be added later.
    """

    def __init__(
        self,
        lambda_ssim=0.1,
        lambda_gradient=0.1
    ):
        super().__init__()

        self.charbonnier = CharbonnierLoss()

        self.ssim = SSIMLoss()

        self.gradient = GradientLoss()

        self.lambda_ssim = lambda_ssim

        self.lambda_gradient = lambda_gradient

    def forward(self, prediction, target):

        loss_charbonnier = self.charbonnier(
            prediction,
            target
        )

        loss_ssim = self.ssim(
            prediction,
            target
        )

        loss_gradient = self.gradient(
            prediction,
            target
        )

        total_loss = (
            loss_charbonnier
            + self.lambda_ssim * loss_ssim
            + self.lambda_gradient * loss_gradient
        )

        return {
            "total": total_loss,
            "charbonnier": loss_charbonnier,
            "ssim": loss_ssim,
            "gradient": loss_gradient,
        }