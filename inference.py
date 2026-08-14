"""
inference.py

Mandatory competition inference script (KLA requirement C).

Requirements this satisfies:
  - Accepts --input_dir and --output_dir arguments (no hardcoded paths)
  - Loads every degraded .npy image in input_dir
  - Restores each with DARC-Net
  - Saves each restored image to output_dir, same filename, as .npy
  - Supports NVIDIA GPU execution
  - Batch processing (not one-by-one)
  - Requires no source-code edits or local path changes to run

Usage:
    python inference.py --input_dir ./Test_NoisyLR --output_dir ./results/test_restored --checkpoint weights/darc_losses_best.pth

Optional:
    --batch_size 16          (default 16)
    --device cuda|cpu        (default: auto-detect)
    --save_png                (also save a viewable .png alongside each .npy, for
                                quick visual spot-checks -- NOT the scored output)
"""

import argparse
import time
from pathlib import Path

import numpy as np
import torch

from src.darc_net import DARCNet


def list_npy_files(folder: Path):
    """List .npy files, ignoring __MACOSX and AppleDouble junk (._*)."""
    files = []
    for p in sorted(folder.rglob("*.npy")):
        if "__MACOSX" in p.parts:
            continue
        if p.name.startswith("._"):
            continue
        files.append(p)
    return files


def load_checkpoint(model, checkpoint_path, device):
    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)
    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        model.load_state_dict(ckpt["model_state_dict"])
        print(f"Loaded checkpoint. Epoch: {ckpt.get('epoch', 'unknown')}")
    elif isinstance(ckpt, dict) and "state_dict" in ckpt:
        model.load_state_dict(ckpt["state_dict"])
        print("Loaded checkpoint (state_dict format).")
    else:
        model.load_state_dict(ckpt)
        print("Loaded checkpoint (raw state_dict format).")
    return model


def main():
    parser = argparse.ArgumentParser(description="DARC-Net standalone inference")
    parser.add_argument("--input_dir", type=str, required=True,
                         help="Folder containing degraded NoisyLR .npy files")
    parser.add_argument("--output_dir", type=str, required=True,
                         help="Folder to write restored .npy files to")
    parser.add_argument("--checkpoint", type=str, required=True,
                         help="Path to trained model checkpoint (.pth)")
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--device", type=str, default=None,
                         help="cuda or cpu. Default: auto-detect.")
    parser.add_argument("--save_png", action="store_true",
                         help="Also save a viewable .png per image (not the scored output)")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.device is not None:
        device = torch.device(args.device)
    else:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(f"Device: {device}")
    if device.type == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    # -----------------------------------------------------------------
    # 1. Find all input files
    # -----------------------------------------------------------------
    input_files = list_npy_files(input_dir)
    print(f"Found {len(input_files)} input .npy files in {input_dir}")
    if len(input_files) == 0:
        raise RuntimeError(f"No .npy files found in {input_dir}. Check the path.")

    # -----------------------------------------------------------------
    # 2. Load model
    # -----------------------------------------------------------------
    model = DARCNet().to(device)
    model = load_checkpoint(model, args.checkpoint, device)
    model.eval()

    # -----------------------------------------------------------------
    # 3. Batch inference over all files
    # -----------------------------------------------------------------
    t_start = time.time()
    n_processed = 0

    with torch.no_grad():
        for batch_start in range(0, len(input_files), args.batch_size):
            batch_files = input_files[batch_start: batch_start + args.batch_size]

            # Load and stack this batch
            batch_arrays = [np.load(p).astype(np.float32) for p in batch_files]
            batch_tensor = torch.from_numpy(np.stack(batch_arrays)).unsqueeze(1).to(device)
            # shape: (B, 1, 128, 128)

            output = model(batch_tensor)                # (B, 1, 256, 256)
            output_clipped = torch.clamp(output, 0.0, 1.0)
            output_np = output_clipped.squeeze(1).cpu().numpy()  # (B, 256, 256)

            for i, src_path in enumerate(batch_files):
                restored = output_np[i]
                out_path = output_dir / src_path.name  # SAME filename, as required
                np.save(out_path, restored.astype(np.float32))

                if args.save_png:
                    import matplotlib
                    matplotlib.use("Agg")
                    import matplotlib.pyplot as plt
                    png_path = output_dir / (src_path.stem + ".png")
                    plt.imsave(png_path, restored, cmap="gray", vmin=0, vmax=1)

            n_processed += len(batch_files)
            print(f"  Processed {n_processed}/{len(input_files)}", end="\r")

    elapsed = time.time() - t_start
    print(f"\n\nDone. Restored {n_processed} images in {elapsed:.2f}s "
          f"({n_processed / elapsed:.2f} images/sec).")
    print(f"Note: this is MODEL-ONLY-plus-IO timing from this run, not the official "
          f"end-to-end benchmark methodology (see benchmark script).")
    print(f"Output saved to: {output_dir}")


if __name__ == "__main__":
    main()