"""
scripts/benchmark_e2e.py

Item #12: True end-to-end runtime benchmark.

KLA's official runtime definition (from the problem statement PDF):
  "End-to-end runtime includes disk reading, preprocessing, CPU-to-GPU
   transfer, model execution, GPU-to-CPU transfer, post-processing and
   saving restored images."

This script times each of those stages separately, per batch, using
torch.cuda.synchronize() around every GPU-touching step so the numbers
are real (not just "how long it took to queue the work").

Includes a warmup phase (excluded from timing) since the first few GPU
calls include one-time CUDA setup costs that would otherwise unfairly
inflate the reported latency.

Usage:
    python scripts/benchmark_e2e.py --input_dir "C:\\Users\\balam\\Desktop\\train\\NoisyLR" ^
        --checkpoint weights/darc_losses_best.pth ^
        --batch_size 16 --n_warmup 5 --n_batches 30 --out_dir ./results/benchmark
"""

import argparse
import json
import platform
import time
from pathlib import Path

import numpy as np
import torch

from src.darc_net import DARCNet


def list_npy_files(folder: Path):
    files = []
    for p in sorted(folder.rglob("*.npy")):
        if "__MACOSX" in p.parts or p.name.startswith("._"):
            continue
        files.append(p)
    return files


def load_checkpoint(model, checkpoint_path, device):
    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)
    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        model.load_state_dict(ckpt["model_state_dict"])
    elif isinstance(ckpt, dict) and "state_dict" in ckpt:
        model.load_state_dict(ckpt["state_dict"])
    else:
        model.load_state_dict(ckpt)
    return model


def sync_if_cuda(device):
    if device.type == "cuda":
        torch.cuda.synchronize()


def run_one_batch(batch_files, model, device, out_dir, save_output=True):
    """
    Runs and times every stage for ONE batch. Returns a dict of stage
    timings in seconds. This function itself is what gets repeated for
    warmup and for the timed runs.
    """
    timings = {}

    # --- Disk read ---
    t0 = time.perf_counter()
    arrays = [np.load(p).astype(np.float32) for p in batch_files]
    t1 = time.perf_counter()
    timings["disk_read"] = t1 - t0

    # --- Preprocessing (stack + add channel dim) ---
    t0 = time.perf_counter()
    batch_np = np.stack(arrays)[:, None, :, :]  # (B, 1, 128, 128)
    batch_cpu_tensor = torch.from_numpy(batch_np)
    t1 = time.perf_counter()
    timings["preprocess"] = t1 - t0

    # --- CPU -> GPU transfer ---
    t0 = time.perf_counter()
    batch_gpu_tensor = batch_cpu_tensor.to(device)
    sync_if_cuda(device)
    t1 = time.perf_counter()
    timings["cpu_to_gpu"] = t1 - t0

    # --- Model execution ---
    t0 = time.perf_counter()
    with torch.no_grad():
        output = model(batch_gpu_tensor)
    sync_if_cuda(device)
    t1 = time.perf_counter()
    timings["model_execution"] = t1 - t0

    # --- GPU -> CPU transfer ---
    t0 = time.perf_counter()
    output_cpu = output.cpu()
    sync_if_cuda(device)
    t1 = time.perf_counter()
    timings["gpu_to_cpu"] = t1 - t0

    # --- Postprocessing (clip) ---
    t0 = time.perf_counter()
    output_np = torch.clamp(output_cpu, 0.0, 1.0).squeeze(1).numpy()
    t1 = time.perf_counter()
    timings["postprocess"] = t1 - t0

    # --- Saving ---
    t0 = time.perf_counter()
    if save_output:
        for i, src_path in enumerate(batch_files):
            np.save(out_dir / src_path.name, output_np[i].astype(np.float32))
    t1 = time.perf_counter()
    timings["save"] = t1 - t0

    timings["total"] = sum(timings.values())
    return timings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", type=str, required=True)
    parser.add_argument("--checkpoint", type=str, required=True)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--n_warmup", type=int, default=5,
                         help="Number of warmup batches, excluded from timing")
    parser.add_argument("--n_batches", type=int, default=30,
                         help="Number of TIMED batches to average over")
    parser.add_argument("--out_dir", type=str, default="./results/benchmark")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    saved_dir = out_dir / "benchmark_outputs"
    saved_dir.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    if device.type == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    input_files = list_npy_files(Path(args.input_dir))
    needed = args.batch_size * (args.n_warmup + args.n_batches)
    if len(input_files) < needed:
        print(f"WARNING: only {len(input_files)} files available, need {needed} "
              f"for {args.n_warmup} warmup + {args.n_batches} timed batches at "
              f"batch_size={args.batch_size}. Will reuse files by cycling.")
        # Cycle the file list so we always have enough, without crashing.
        while len(input_files) < needed:
            input_files += input_files
    input_files = input_files[:needed]

    model = DARCNet().to(device)
    model = load_checkpoint(model, args.checkpoint, device)
    model.eval()

    # Split into warmup batches and timed batches
    batches = [
        input_files[i:i + args.batch_size]
        for i in range(0, len(input_files), args.batch_size)
    ]
    warmup_batches = batches[:args.n_warmup]
    timed_batches = batches[args.n_warmup:args.n_warmup + args.n_batches]

    print(f"\nRunning {len(warmup_batches)} warmup batches (untimed)...")
    for b in warmup_batches:
        run_one_batch(b, model, device, saved_dir, save_output=False)

    print(f"Running {len(timed_batches)} timed batches (batch_size={args.batch_size})...\n")
    all_timings = []
    for i, b in enumerate(timed_batches, 1):
        t = run_one_batch(b, model, device, saved_dir, save_output=True)
        all_timings.append(t)
        if i % 5 == 0 or i == len(timed_batches):
            print(f"  Batch {i}/{len(timed_batches)}  total={t['total']*1000:.2f}ms")

    # -----------------------------------------------------------------
    # Aggregate
    # -----------------------------------------------------------------
    stages = ["disk_read", "preprocess", "cpu_to_gpu", "model_execution",
              "gpu_to_cpu", "postprocess", "save", "total"]

    mean_per_batch = {s: float(np.mean([t[s] for t in all_timings])) for s in stages}
    std_per_batch = {s: float(np.std([t[s] for t in all_timings])) for s in stages}

    total_images = len(timed_batches) * args.batch_size
    total_time = sum(t["total"] for t in all_timings)
    images_per_sec = total_images / total_time
    mean_latency_per_image_ms = (mean_per_batch["total"] / args.batch_size) * 1000

    result = {
        "hardware": {
            "gpu": torch.cuda.get_device_name(0) if device.type == "cuda" else "CPU",
            "cuda_version": torch.version.cuda,
            "torch_version": torch.__version__,
            "python_version": platform.python_version(),
            "os": platform.platform(),
        },
        "config": {
            "batch_size": args.batch_size,
            "n_warmup_batches": args.n_warmup,
            "n_timed_batches": len(timed_batches),
            "total_images_timed": total_images,
        },
        "stage_timings_mean_seconds_per_batch": mean_per_batch,
        "stage_timings_std_seconds_per_batch": std_per_batch,
        "throughput": {
            "images_per_second": images_per_sec,
            "mean_latency_ms_per_image": mean_latency_per_image_ms,
        },
    }

    print("\n" + "=" * 60)
    print("END-TO-END BENCHMARK RESULT")
    print("=" * 60)
    print(f"Batch size        : {args.batch_size}")
    print(f"Timed batches     : {len(timed_batches)}  ({total_images} images)")
    print(f"Images/sec        : {images_per_sec:.2f}")
    print(f"Latency/image     : {mean_latency_per_image_ms:.2f} ms")
    print("\nStage breakdown (mean per batch, ms):")
    for s in stages:
        print(f"  {s:<18}: {mean_per_batch[s]*1000:8.2f} ms  "
              f"({100*mean_per_batch[s]/mean_per_batch['total']:5.1f}%)")
    print("=" * 60)

    with open(out_dir / "benchmark_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nSaved: {out_dir / 'benchmark_result.json'}")


if __name__ == "__main__":
    main()