"""
scripts/inspect_dataset.py

Stage 1: FULL Dataset Inspection (all pairs, not a sample)
Member 1 - Dataset, Preprocessing & Baseline

Scans TRAIN/GT and TRAIN/NoisyLR completely and reports:
  - GT count, NoisyLR count
  - matched filenames, missing pairs (either direction)
  - shape distribution (majority shape + any outliers)
  - dtype distribution
  - global min/max, mean-of-means, mean-of-stds (streamed, not RAM-heavy)
  - NaN / Inf files
  - corrupted / unreadable files
  - unusual dimensions relative to the majority shape

Outputs (written to --out):
  inspection_summary.txt   -> human readable report
  inspection_summary.json  -> machine readable report (for later automated checks)
  per_file_stats.csv       -> per-file stats for manual triage / filtering bad files

Run:
  python scripts/inspect_dataset.py --root /path/to/TRAIN --out ./inspection_report
"""

import argparse
import csv
import json
import time
from collections import Counter
from pathlib import Path

import numpy as np


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


def safe_load(path: Path):
    """Try to load an npy file. Returns (array, error_string_or_None)."""
    try:
        arr = np.load(path)
        return arr, None
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=str, required=True,
                         help="Path to TRAIN folder (containing GT/ and NoisyLR/)")
    parser.add_argument("--out", type=str, default="./inspection_report",
                         help="Where to save reports")
    parser.add_argument("--progress_every", type=int, default=500,
                         help="Print progress every N files")
    args = parser.parse_args()

    root = Path(args.root)
    gt_dir = root / "GT"
    lr_dir = root / "NoisyLR"
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    assert gt_dir.exists(), f"GT dir not found: {gt_dir}"
    assert lr_dir.exists(), f"NoisyLR dir not found: {lr_dir}"

    t0 = time.time()

    # -----------------------------------------------------------------
    # 1. Enumerate files, ignoring __MACOSX / AppleDouble junk
    # -----------------------------------------------------------------
    gt_files = list_npy_files(gt_dir)
    lr_files = list_npy_files(lr_dir)

    gt_names = {p.name: p for p in gt_files}
    lr_names = {p.name: p for p in lr_files}

    missing_in_lr = sorted(set(gt_names) - set(lr_names))
    missing_in_gt = sorted(set(lr_names) - set(gt_names))
    matched = sorted(set(gt_names) & set(lr_names))

    print(f"GT files found      : {len(gt_files)}")
    print(f"NoisyLR files found : {len(lr_files)}")
    print(f"Matched pairs       : {len(matched)}")
    print(f"GT without LR pair  : {len(missing_in_lr)}")
    print(f"LR without GT pair  : {len(missing_in_gt)}")

    if len(matched) == 0:
        raise RuntimeError("No matched pairs found. Check folder structure / filenames.")

    # -----------------------------------------------------------------
    # 2. Streaming per-file scan (GT and NoisyLR separately)
    #    Uses Welford's online algorithm for mean/std so we never
    #    hold all pixels in memory at once.
    # -----------------------------------------------------------------
    def new_accumulator():
        return {
            "n_images": 0,
            "shape_counter": Counter(),
            "dtype_counter": Counter(),
            "global_min": float("inf"),
            "global_max": float("-inf"),
            "mean_of_means": 0.0,   # running mean of per-image means
            "mean_of_stds": 0.0,    # running mean of per-image stds
            "nan_files": [],
            "inf_files": [],
            "corrupted_files": [],
        }

    def update_accumulator(acc, name, arr):
        acc["n_images"] += 1
        acc["shape_counter"][arr.shape] += 1
        acc["dtype_counter"][str(arr.dtype)] += 1

        arr_f = arr.astype(np.float64, copy=False)

        has_nan = bool(np.isnan(arr_f).any())
        has_inf = bool(np.isinf(arr_f).any())
        if has_nan:
            acc["nan_files"].append(name)
        if has_inf:
            acc["inf_files"].append(name)

        # Skip range/mean stats if NaN/Inf present (would poison global min/max)
        if not has_nan and not has_inf:
            mn, mx = float(arr_f.min()), float(arr_f.max())
            acc["global_min"] = min(acc["global_min"], mn)
            acc["global_max"] = max(acc["global_max"], mx)

            n = acc["n_images"]
            img_mean = float(arr_f.mean())
            img_std = float(arr_f.std())
            # incremental running average
            acc["mean_of_means"] += (img_mean - acc["mean_of_means"]) / n
            acc["mean_of_stds"] += (img_std - acc["mean_of_stds"]) / n

    gt_acc = new_accumulator()
    lr_acc = new_accumulator()

    per_file_rows = []

    print("\nScanning matched pairs...")
    for i, name in enumerate(matched, 1):
        gt_arr, gt_err = safe_load(gt_names[name])
        lr_arr, lr_err = safe_load(lr_names[name])

        row = {"filename": name}

        if gt_err is not None:
            gt_acc["corrupted_files"].append((name, gt_err))
            row.update({"gt_shape": None, "gt_dtype": None, "gt_min": None,
                        "gt_max": None, "gt_mean": None, "gt_std": None, "gt_error": gt_err})
        else:
            update_accumulator(gt_acc, name, gt_arr)
            arr_f = gt_arr.astype(np.float64, copy=False)
            row.update({
                "gt_shape": gt_arr.shape, "gt_dtype": str(gt_arr.dtype),
                "gt_min": float(arr_f.min()), "gt_max": float(arr_f.max()),
                "gt_mean": float(arr_f.mean()), "gt_std": float(arr_f.std()),
                "gt_error": None,
            })

        if lr_err is not None:
            lr_acc["corrupted_files"].append((name, lr_err))
            row.update({"lr_shape": None, "lr_dtype": None, "lr_min": None,
                        "lr_max": None, "lr_mean": None, "lr_std": None, "lr_error": lr_err})
        else:
            update_accumulator(lr_acc, name, lr_arr)
            arr_f = lr_arr.astype(np.float64, copy=False)
            row.update({
                "lr_shape": lr_arr.shape, "lr_dtype": str(lr_arr.dtype),
                "lr_min": float(arr_f.min()), "lr_max": float(arr_f.max()),
                "lr_mean": float(arr_f.mean()), "lr_std": float(arr_f.std()),
                "lr_error": None,
            })

        per_file_rows.append(row)

        if i % args.progress_every == 0 or i == len(matched):
            elapsed = time.time() - t0
            print(f"  {i}/{len(matched)} pairs scanned  ({elapsed:.1f}s elapsed)")

    # -----------------------------------------------------------------
    # 3. Determine majority shape and flag outliers
    # -----------------------------------------------------------------
    def majority_shape_and_outliers(acc, names_map, per_file_key):
        if not acc["shape_counter"]:
            return None, []
        majority_shape, _ = acc["shape_counter"].most_common(1)[0]
        outliers = [
            row["filename"] for row in per_file_rows
            if row.get(per_file_key) is not None and row.get(per_file_key) != majority_shape
        ]
        return majority_shape, outliers

    gt_majority_shape, gt_shape_outliers = majority_shape_and_outliers(gt_acc, gt_names, "gt_shape")
    lr_majority_shape, lr_shape_outliers = majority_shape_and_outliers(lr_acc, lr_names, "lr_shape")

    # -----------------------------------------------------------------
    # 4. Build summary report
    # -----------------------------------------------------------------
    summary = {
        "pairing": {
            "gt_file_count": len(gt_files),
            "lr_file_count": len(lr_files),
            "matched_pairs": len(matched),
            "gt_without_lr": missing_in_lr,
            "lr_without_gt": missing_in_gt,
        },
        "GT": {
            "n_scanned": gt_acc["n_images"],
            "majority_shape": gt_majority_shape,
            "shape_distribution": {str(k): v for k, v in gt_acc["shape_counter"].items()},
            "dtype_distribution": dict(gt_acc["dtype_counter"]),
            "global_min": gt_acc["global_min"] if gt_acc["global_min"] != float("inf") else None,
            "global_max": gt_acc["global_max"] if gt_acc["global_max"] != float("-inf") else None,
            "mean_of_per_image_means": gt_acc["mean_of_means"],
            "mean_of_per_image_stds": gt_acc["mean_of_stds"],
            "files_with_nan": gt_acc["nan_files"],
            "files_with_inf": gt_acc["inf_files"],
            "corrupted_files": gt_acc["corrupted_files"],
            "shape_outliers": gt_shape_outliers,
        },
        "NoisyLR": {
            "n_scanned": lr_acc["n_images"],
            "majority_shape": lr_majority_shape,
            "shape_distribution": {str(k): v for k, v in lr_acc["shape_counter"].items()},
            "dtype_distribution": dict(lr_acc["dtype_counter"]),
            "global_min": lr_acc["global_min"] if lr_acc["global_min"] != float("inf") else None,
            "global_max": lr_acc["global_max"] if lr_acc["global_max"] != float("-inf") else None,
            "mean_of_per_image_means": lr_acc["mean_of_means"],
            "mean_of_per_image_stds": lr_acc["mean_of_stds"],
            "files_with_nan": lr_acc["nan_files"],
            "files_with_inf": lr_acc["inf_files"],
            "corrupted_files": lr_acc["corrupted_files"],
            "shape_outliers": lr_shape_outliers,
        },
        "elapsed_seconds": time.time() - t0,
    }

    # -----------------------------------------------------------------
    # 5. Write outputs
    # -----------------------------------------------------------------
    json_path = out_dir / "inspection_summary.json"
    with open(json_path, "w") as f:
        json.dump(summary, f, indent=2, default=str)

    csv_path = out_dir / "per_file_stats.csv"
    fieldnames = ["filename", "gt_shape", "gt_dtype", "gt_min", "gt_max", "gt_mean", "gt_std", "gt_error",
                  "lr_shape", "lr_dtype", "lr_min", "lr_max", "lr_mean", "lr_std", "lr_error"]
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(per_file_rows)

    txt_path = out_dir / "inspection_summary.txt"
    with open(txt_path, "w") as f:
        def w(line=""):
            print(line)
            f.write(line + "\n")

        w("=" * 70)
        w("DATASET INSPECTION SUMMARY")
        w("=" * 70)
        w(f"GT files found       : {len(gt_files)}")
        w(f"NoisyLR files found  : {len(lr_files)}")
        w(f"Matched pairs        : {len(matched)}")
        w(f"GT without LR pair   : {len(missing_in_lr)}")
        w(f"LR without GT pair   : {len(missing_in_gt)}")
        if missing_in_lr:
            w(f"  e.g.: {missing_in_lr[:10]}")
        if missing_in_gt:
            w(f"  e.g.: {missing_in_gt[:10]}")

        for label, acc, maj_shape, outliers in [
            ("GT", gt_acc, gt_majority_shape, gt_shape_outliers),
            ("NoisyLR", lr_acc, lr_majority_shape, lr_shape_outliers),
        ]:
            w("\n" + "-" * 70)
            w(f"{label}")
            w("-" * 70)
            w(f"  Scanned successfully : {acc['n_images']}")
            w(f"  Majority shape       : {maj_shape}")
            w(f"  Shape distribution   : {dict(acc['shape_counter'])}")
            w(f"  Dtype distribution   : {dict(acc['dtype_counter'])}")
            gmin = acc["global_min"] if acc["global_min"] != float("inf") else None
            gmax = acc["global_max"] if acc["global_max"] != float("-inf") else None
            w(f"  Global min           : {gmin}")
            w(f"  Global max           : {gmax}")
            w(f"  Mean of per-img mean : {acc['mean_of_means']:.6f}")
            w(f"  Mean of per-img std  : {acc['mean_of_stds']:.6f}")
            w(f"  Files with NaN       : {len(acc['nan_files'])}")
            if acc["nan_files"]:
                w(f"    e.g.: {acc['nan_files'][:10]}")
            w(f"  Files with Inf       : {len(acc['inf_files'])}")
            if acc["inf_files"]:
                w(f"    e.g.: {acc['inf_files'][:10]}")
            w(f"  Corrupted files      : {len(acc['corrupted_files'])}")
            if acc["corrupted_files"]:
                for fname, err in acc["corrupted_files"][:10]:
                    w(f"    {fname}: {err}")
            w(f"  Shape outliers       : {len(outliers)}")
            if outliers:
                w(f"    e.g.: {outliers[:10]}")

        w("\n" + "=" * 70)
        w(f"Done in {summary['elapsed_seconds']:.1f}s")
        w("=" * 70)

    print(f"\nSaved: {json_path}")
    print(f"Saved: {csv_path}")
    print(f"Saved: {txt_path}")


if __name__ == "__main__":
    main()
    