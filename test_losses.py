import torch

from src.losses import (
    CharbonnierLoss,
    SSIMLoss,
    GradientLoss,
    RestorationLoss,
)


device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Device:", device)


# ============================================================
# Test 1: Prediction == Target
# ============================================================

target = torch.rand(
    2, 1, 256, 256,
    device=device
)

prediction_same = target.clone()


ssim_loss = SSIMLoss().to(device)

same_loss = ssim_loss(
    prediction_same,
    target
)

print("\nTest 1: Prediction == Target")
print(f"SSIM Loss: {same_loss.item():.8f}")


# ============================================================
# Test 2: Prediction != Target
# ============================================================

prediction_different = torch.rand(
    2, 1, 256, 256,
    device=device
)

different_loss = ssim_loss(
    prediction_different,
    target
)

print("\nTest 2: Prediction != Target")
print(f"SSIM Loss: {different_loss.item():.8f}")


# ============================================================
# Basic sanity checks
# ============================================================

assert same_loss.item() < 0.01, \
    "SSIM loss should be close to 0 when prediction == target."

assert different_loss.item() > same_loss.item(), \
    "SSIM loss should increase when prediction differs from target."


print("\n================================")
print("SSIM SANITY TEST: SUCCESS")
print("================================")