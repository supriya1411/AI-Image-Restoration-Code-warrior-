"""
scripts/compare_results.py

Item #3: Final baseline-vs-DARC-Net comparison table.

Reads the two summary.json files produced by evaluate_baseline_full.py and
evaluate_darc_full.py, and produces one clean table -- console output,
a .txt file, and a .csv -- ready to paste directly into the PPT.

Usage:
    python scripts/compare_results.py
"""

import csv
import json
from pathlib import Path

BASELINE_SUMMARY = Path("./results/baseline_full_eval/summary.json")
DARC_SUMMARY = Path("./results/darc_full_eval/summary.json")
OUT_DIR = Path("./results/comparisons")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(BASELINE_SUMMARY) as f:
        baseline = json.load(f)
    with open(DARC_SUMMARY) as f:
        darc = json.load(f)

    rows = [
        {"Model": "Baseline CNN", "PSNR": baseline["PSNR"], "SSIM": baseline["SSIM"], "LPIPS": baseline["LPIPS"]},
        {"Model": "DARC-Net", "PSNR": darc["PSNR"], "SSIM": darc["SSIM"], "LPIPS": darc["LPIPS"]},
    ]

    psnr_gain = darc["PSNR"] - baseline["PSNR"]
    ssim_gain = darc["SSIM"] - baseline["SSIM"]
    lpips_gain = baseline["LPIPS"] - darc["LPIPS"]  # lower is better, so reversed

    print("\n" + "=" * 55)
    print(f"{'Model':<15}{'PSNR (dB)':>12}{'SSIM':>10}{'LPIPS':>10}")
    print("-" * 55)
    for r in rows:
        print(f"{r['Model']:<15}{r['PSNR']:>12.4f}{r['SSIM']:>10.4f}{r['LPIPS']:>10.4f}")
    print("=" * 55)
    print(f"\nDARC-Net vs Baseline:")
    print(f"  PSNR:  {'+' if psnr_gain >= 0 else ''}{psnr_gain:.4f} dB")
    print(f"  SSIM:  {'+' if ssim_gain >= 0 else ''}{ssim_gain:.4f}")
    print(f"  LPIPS: {'improved by' if lpips_gain >= 0 else 'worse by'} {abs(lpips_gain):.4f}")

    with open(OUT_DIR / "comparison_table.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Model", "PSNR", "SSIM", "LPIPS"])
        writer.writeheader()
        writer.writerows(rows)

    with open(OUT_DIR / "comparison_table.txt", "w") as f:
        f.write(f"{'Model':<15}{'PSNR (dB)':>12}{'SSIM':>10}{'LPIPS':>10}\n")
        for r in rows:
            f.write(f"{r['Model']:<15}{r['PSNR']:>12.4f}{r['SSIM']:>10.4f}{r['LPIPS']:>10.4f}\n")
        f.write(f"\nDARC-Net vs Baseline:\n")
        f.write(f"  PSNR:  {'+' if psnr_gain >= 0 else ''}{psnr_gain:.4f} dB\n")
        f.write(f"  SSIM:  {'+' if ssim_gain >= 0 else ''}{ssim_gain:.4f}\n")
        f.write(f"  LPIPS: {'improved by' if lpips_gain >= 0 else 'worse by'} {abs(lpips_gain):.4f}\n")

    print(f"\nSaved: {OUT_DIR / 'comparison_table.csv'}")
    print(f"Saved: {OUT_DIR / 'comparison_table.txt'}")


if __name__ == "__main__":
    main()