"""
scripts/evaluate_darc_full.py

Extends evaluate_darc.py: keeps the exact same aggregate PSNR/SSIM/LPIPS
computation (same RestorationMetrics class, same checkpoint loading), but
also captures PER-IMAGE scores by calling the metrics as functions
(metric(x, y)) instead of only metric.update(x, y).

torchmetrics detail: calling a metric instance as metric(pred, target) both
(a) accumulates internal state exactly like .update() would, and
(b) returns the score for just that call.
So looping one image at a time and capturing each return value gives true
per-image scores, while metrics.compute() at the end still returns the
identical correct aggregate over all images.

Outputs to results/darc_full_eval/:
  per_image_metrics.csv
  summary.txt
  examples/best_*.png   (top N by PSNR)
  examples/worst_*.png  (bottom N by PSNR -- failure cases)

Usage:
    python scripts/evaluate_darc_full.py
(edit the CONFIG block below, same style as evaluate_darc.py)
"""

import csv
import json
from pathlib import Path

import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from src.data_split import build_dataloaders
from src.darc_net import DARCNet
from src.metrics import RestorationMetrics


# -----------------------------------------------------------------
# CONFIG -- match evaluate_darc.py exactly, adjust CHECKPOINT if needed
# -----------------------------------------------------------------
DATA_ROOT = r"C:\Users\balam\Desktop\train"
CHECKPOINT = "weights/darc_losses_best.pth"   # <-- confirm this matches your real filename
BATCH_SIZE = 4
OUT_DIR = Path("./results/darc_full_eval")
N_EXAMPLES = 5

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def save_comparison_png(lr_arr, pred_arr, gt_arr, title, path):
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    axes[0].imshow(np.clip(lr_arr, 0, 1), cmap="gray")
    axes[0].set_title("NoisyLR (input)")
    axes[0].axis("off")
    axes[1].imshow(pred_arr, cmap="gray")
    axes[1].set_title("Restored")
    axes[1].axis("off")
    axes[2].imshow(gt_arr, cmap="gray")
    axes[2].set_title("Ground Truth")
    axes[2].axis("off")
    fig.suptitle(title)
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close(fig)


def main():
    examples_dir = OUT_DIR / "examples"
    examples_dir.mkdir(parents=True, exist_ok=True)

    print("Device:", DEVICE)
    if DEVICE.type == "cuda":
        print("GPU:", torch.cuda.get_device_name(0))

    # Same validation split used everywhere else
    _, val_loader, _, val_ds = build_dataloaders(
        DATA_ROOT, batch_size=BATCH_SIZE, val_fraction=0.125, seed=42, num_workers=0,
    )
    print("Validation samples:", len(val_ds))

    model = DARCNet().to(DEVICE)
    checkpoint = torch.load(CHECKPOINT, map_location=DEVICE, weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    print("Loaded DARC-Net checkpoint. Epoch:", checkpoint["epoch"])
    model.eval()

    metrics = RestorationMetrics(DEVICE)

    rows = []

    print("\nEvaluating DARC-Net (per-image)...\n")
    with torch.no_grad():
        for batch_idx, (lr, gt, names) in enumerate(val_loader, start=1):
            lr = lr.to(DEVICE)
            gt = gt.to(DEVICE)
            output = model(lr)

            # Loop one image at a time so we get a per-image score back,
            # while metrics still accumulates correctly for the final aggregate.
            for i, name in enumerate(names):
                pred_i = output[i:i + 1]
                gt_i = gt[i:i + 1]

                pred_clamped = torch.clamp(pred_i, 0.0, 1.0)
                gt_clamped = torch.clamp(gt_i, 0.0, 1.0)

                psnr_val = metrics.psnr(pred_clamped, gt_clamped).item()
                ssim_val = metrics.ssim(pred_clamped, gt_clamped).item()

                pred_lpips = (pred_clamped.repeat(1, 3, 1, 1) * 2.0 - 1.0)
                gt_lpips = (gt_clamped.repeat(1, 3, 1, 1) * 2.0 - 1.0)
                lpips_val = metrics.lpips(pred_lpips, gt_lpips).item()

                rows.append({"filename": name, "psnr": psnr_val,
                             "ssim": ssim_val, "lpips": lpips_val})

            if batch_idx % 10 == 0 or batch_idx == len(val_loader):
                print(f"Processed {batch_idx}/{len(val_loader)} batches, "
                      f"{len(rows)}/{len(val_ds)} images")

    # -----------------------------------------------------------------
    # Aggregate -- identical math to evaluate_darc.py's metrics.compute()
    # -----------------------------------------------------------------
    results = metrics.compute()
    print("\n=============================================")
    print("DARC-NET EVALUATION RESULTS (n={})".format(len(rows)))
    print("=============================================")
    print(f"PSNR  : {results['PSNR']:.4f} dB")
    print(f"SSIM  : {results['SSIM']:.4f}")
    print(f"LPIPS : {results['LPIPS']:.4f}")
    print("=============================================")

    with open(OUT_DIR / "summary.json", "w") as f:
        json.dump({"n_images": len(rows), **results}, f, indent=2)
    with open(OUT_DIR / "summary.txt", "w") as f:
        f.write(f"n_images: {len(rows)}\n")
        f.write(f"PSNR:  {results['PSNR']:.4f} dB\n")
        f.write(f"SSIM:  {results['SSIM']:.4f}\n")
        f.write(f"LPIPS: {results['LPIPS']:.4f}\n")

    with open(OUT_DIR / "per_image_metrics.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "psnr", "ssim", "lpips"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved: {OUT_DIR / 'summary.txt'}")
    print(f"Saved: {OUT_DIR / 'per_image_metrics.csv'}")

    # -----------------------------------------------------------------
    # Best / worst examples (by PSNR) for the PPT + failure analysis
    # -----------------------------------------------------------------
    rows_sorted = sorted(rows, key=lambda r: r["psnr"], reverse=True)
    best = rows_sorted[:N_EXAMPLES]
    worst = rows_sorted[-N_EXAMPLES:]

    gt_dir = Path(DATA_ROOT) / "GT"
    lr_dir = Path(DATA_ROOT) / "NoisyLR"

    for tag, group in [("best", best), ("worst", worst)]:
        for r in group:
            name = r["filename"]
            lr_arr = np.load(lr_dir / name)
            gt_arr = np.load(gt_dir / name)

            lr_t = torch.from_numpy(lr_arr).unsqueeze(0).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                pred = model(lr_t).squeeze().cpu().numpy()
            pred_clipped = np.clip(pred, 0.0, 1.0)

            title = f"{name}  PSNR={r['psnr']:.2f} SSIM={r['ssim']:.3f} LPIPS={r['lpips']:.3f}"
            out_path = examples_dir / f"{tag}_{Path(name).stem}.png"
            save_comparison_png(lr_arr, pred_clipped, gt_arr, title, out_path)

    print(f"Saved {N_EXAMPLES} best + {N_EXAMPLES} worst examples to: {examples_dir}")


if __name__ == "__main__":
    main()