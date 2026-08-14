import torch

from src.data_split import build_dataloaders
from src.darc_net import DARCNet
from src.metrics import RestorationMetrics


DATA_ROOT = r"C:\Users\balam\Desktop\train"
CHECKPOINT = "weights/darc_best.pth"
BATCH_SIZE = 4

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


print("Device:", DEVICE)

if DEVICE.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))


# Same validation split used for baseline
_, val_loader, _, val_ds = build_dataloaders(
    DATA_ROOT,
    batch_size=BATCH_SIZE,
    val_fraction=0.125,
    seed=42,
    num_workers=0,
)

print("Validation samples:", len(val_ds))


# Create DARC-Net
model = DARCNet().to(DEVICE)


# Load best checkpoint
checkpoint = torch.load(
    CHECKPOINT,
    map_location=DEVICE,
    weights_only=False
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

print("Loaded DARC-Net checkpoint.")
print("Checkpoint epoch:", checkpoint["epoch"])


model.eval()


# Use the EXACT same metric class as baseline
metrics = RestorationMetrics(DEVICE)


print("\nEvaluating DARC-Net...\n")


with torch.no_grad():

    for batch_idx, (lr, gt, names) in enumerate(
        val_loader,
        start=1
    ):

        lr = lr.to(DEVICE)
        gt = gt.to(DEVICE)

        output = model(lr)

        metrics.update(output, gt)

        if batch_idx % 10 == 0 or batch_idx == len(val_loader):
            print(
                f"Processed {batch_idx}/{len(val_loader)} batches"
            )


results = metrics.compute()


print("\n=============================================")
print("DARC-NET EVALUATION RESULTS")
print("=============================================")
print(f"PSNR  : {results['PSNR']:.4f} dB")
print(f"SSIM  : {results['SSIM']:.4f}")
print(f"LPIPS : {results['LPIPS']:.4f}")
print("=============================================")

print("\nHigher PSNR  = better")
print("Higher SSIM  = better")
print("Lower LPIPS  = better")