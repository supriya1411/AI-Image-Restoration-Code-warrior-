import argparse
import torch

from src.data_split import build_dataloaders
from src.darc_net import DARCNet


parser = argparse.ArgumentParser()
parser.add_argument("--root", default=r"C:\Users\balam\Desktop\train")
parser.add_argument("--batch_size", type=int, default=2)
args = parser.parse_args()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Device:", device)
if device.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))

train_loader, _, _, _ = build_dataloaders(
    args.root, batch_size=args.batch_size, num_workers=0
)

lr, gt, names = next(iter(train_loader))
lr = lr.to(device)

model = DARCNet().to(device)
model.eval()

with torch.no_grad():
    output = model(lr)

print("Input shape: ", tuple(lr.shape))
print("GT shape:    ", tuple(gt.shape))
print("Output shape:", tuple(output.shape))
print("Example file:", names[0])

expected = (lr.shape[0], 1, 256, 256)
assert tuple(output.shape) == expected
print("Real-data DARC-Net smoke test: SUCCESS")
print("Stage 7A complete. No training was started.")
