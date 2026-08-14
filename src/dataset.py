"""
src/dataset.py

Stage 2: PyTorch Dataset for paired GT / NoisyLR .npy files.
Member 1 - Dataset, Preprocessing & Baseline

Design decisions (from Stage 1 inspection, confirmed against KLA's official spec):
  - GT:      float32, exactly [0, 1], shape (256, 256)
  - NoisyLR: float32, roughly [-0.28, 2.16], shape (128, 128)
  - Do NOT clip or renormalize NoisyLR. KLA explicitly does not clip/renormalize
    outputs either, and the overshoot/undershoot is real signal-dependent noise,
    not an error.

This file defines ONLY the Dataset class. The DataLoader (batching, shuffling,
train/val split) comes in the next stage.
"""

from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset


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


class KLARestorationDataset(Dataset):
    """
    Paired GT / NoisyLR dataset for the KLA semiconductor restoration task.

    Each item returns:
        lr_tensor : torch.FloatTensor, shape (1, 128, 128)
        gt_tensor : torch.FloatTensor, shape (1, 256, 256)
        filename  : str  (useful later for debugging/visualization)
    """

    def __init__(self, root: str, filenames: list[str] | None = None):
        """
        Args:
            root: path to the TRAIN folder (containing GT/ and NoisyLR/)
            filenames: optional explicit list of filenames to use (for train/val
                       splitting later). If None, uses every matched pair found
                       on disk.
        """
        self.root = Path(root)
        self.gt_dir = self.root / "GT"
        self.lr_dir = self.root / "NoisyLR"

        assert self.gt_dir.exists(), f"GT dir not found: {self.gt_dir}"
        assert self.lr_dir.exists(), f"NoisyLR dir not found: {self.lr_dir}"

        if filenames is not None:
            self.filenames = filenames
        else:
            gt_names = {p.name for p in list_npy_files(self.gt_dir)}
            lr_names = {p.name for p in list_npy_files(self.lr_dir)}
            matched = sorted(gt_names & lr_names)
            assert len(matched) > 0, "No matched GT/NoisyLR pairs found."
            self.filenames = matched

    def __len__(self):
        return len(self.filenames)

    def __getitem__(self, idx):
        name = self.filenames[idx]

        gt_arr = np.load(self.gt_dir / name)       # shape (256, 256), float32, [0,1]
        lr_arr = np.load(self.lr_dir / name)        # shape (128, 128), float32, ~[-0.28, 2.16]

        # Add channel dimension: (H, W) -> (1, H, W)
        # PyTorch image models expect (channels, height, width), not raw (H, W).
        gt_tensor = torch.from_numpy(gt_arr).unsqueeze(0).float()
        lr_tensor = torch.from_numpy(lr_arr).unsqueeze(0).float()

        return lr_tensor, gt_tensor, name


if __name__ == "__main__":
    # Minimal smoke test: run this file directly to sanity-check the Dataset
    # works before wiring it into a DataLoader.
    #
    # Usage:
    #   python src/dataset.py --root "C:\\Users\\balam\\Desktop\\train"
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=str, required=True)
    args = parser.parse_args()

    ds = KLARestorationDataset(args.root)
    print(f"Dataset size: {len(ds)}")

    lr, gt, name = ds[0]
    print(f"Sample: {name}")
    print(f"  LR tensor shape: {tuple(lr.shape)}, dtype: {lr.dtype}, "
          f"min: {lr.min().item():.4f}, max: {lr.max().item():.4f}")
    print(f"  GT tensor shape: {tuple(gt.shape)}, dtype: {gt.dtype}, "
          f"min: {gt.min().item():.4f}, max: {gt.max().item():.4f}")