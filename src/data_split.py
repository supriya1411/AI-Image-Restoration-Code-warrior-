"""
src/data_split.py

Stage 2b: Train/Validation split + DataLoader construction.
Dataset, Preprocessing & Baseline

Builds on src/dataset.py (KLARestorationDataset). This file does NOT redefine
the Dataset -- it just splits filenames and wraps them in DataLoaders.

Design decisions:
  - Split is done on FILENAMES, before creating any Dataset object, so train
    and val Datasets never see each other's files (no leakage).
  - Split uses a fixed random seed so the exact same split can be reproduced
    later (needed to fairly compare baseline vs DARC-Net).
  - Train DataLoader: shuffle=True (order shouldn't matter to the model).
  - Val DataLoader: shuffle=False (no need, and easier to debug/compare runs).
"""

import random
from pathlib import Path

from torch.utils.data import DataLoader

from src.dataset import KLARestorationDataset, list_npy_files


def make_train_val_split(root: str, val_fraction: float = 0.125, seed: int = 42):
    """
    Splits the matched GT/NoisyLR filenames into train and val lists.

    Args:
        root: path to TRAIN folder (containing GT/ and NoisyLR/)
        val_fraction: fraction of pairs to reserve for validation (0.125 -> ~400/3200)
        seed: random seed for reproducibility

    Returns:
        train_filenames, val_filenames  (both lists of str)
    """
    root = Path(root)
    gt_names = {p.name for p in list_npy_files(root / "GT")}
    lr_names = {p.name for p in list_npy_files(root / "NoisyLR")}
    matched = sorted(gt_names & lr_names)  # sorted first for determinism

    rng = random.Random(seed)          # separate generator, doesn't affect global random state
    shuffled = matched.copy()
    rng.shuffle(shuffled)

    n_val = int(len(shuffled) * val_fraction)
    val_filenames = sorted(shuffled[:n_val])
    train_filenames = sorted(shuffled[n_val:])

    # Sanity check: no overlap between train and val
    overlap = set(train_filenames) & set(val_filenames)
    assert len(overlap) == 0, f"Data leakage! {len(overlap)} files in both splits."

    return train_filenames, val_filenames


def build_dataloaders(root: str, batch_size: int = 16, val_fraction: float = 0.125,
                       seed: int = 42, num_workers: int = 0):
    """
    Convenience function: builds train_loader and val_loader in one call.

    num_workers=0 is safest on Windows to start with (avoids multiprocessing
    issues). Once everything works, this can be increased for speed.
    """
    train_files, val_files = make_train_val_split(root, val_fraction, seed)

    train_ds = KLARestorationDataset(root, filenames=train_files)
    val_ds = KLARestorationDataset(root, filenames=val_files)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,
                               num_workers=num_workers)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False,
                             num_workers=num_workers)

    return train_loader, val_loader, train_ds, val_ds


if __name__ == "__main__":
    # Smoke test: run this file directly to confirm the split + DataLoader work.
    #
    # Usage:
    #   python src/data_split.py --root "C:\\Users\\balam\\Desktop\\train"
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=str, required=True)
    parser.add_argument("--batch_size", type=int, default=16)
    args = parser.parse_args()

    train_loader, val_loader, train_ds, val_ds = build_dataloaders(
        args.root, batch_size=args.batch_size
    )

    print(f"Train set size: {len(train_ds)}")
    print(f"Val set size:   {len(val_ds)}")
    print(f"Train batches per epoch: {len(train_loader)}")
    print(f"Val batches per epoch:   {len(val_loader)}")

    # Pull exactly one batch to confirm shapes are correct at batch level.
    lr_batch, gt_batch, names = next(iter(train_loader))
    print(f"\nOne training batch:")
    print(f"  LR batch shape: {tuple(lr_batch.shape)}")   # expect (B, 1, 128, 128)
    print(f"  GT batch shape: {tuple(gt_batch.shape)}")   # expect (B, 1, 256, 256)
    print(f"  Example filenames in batch: {names[:3]}")