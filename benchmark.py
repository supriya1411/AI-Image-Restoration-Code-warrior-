import os
import time
import glob
import numpy as np
import torch

from src.darc_net import DARCNet


# ============================================================
# CONFIGURATION
# ============================================================

CHECKPOINT = r"weights\darc_losses_best.pth"
TEST_DIR = r"test_samples"

WARMUP_RUNS = 10
BENCHMARK_RUNS = 100


# ============================================================
# DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("=" * 60)
print("DARC-NET HARDWARE BENCHMARK")
print("=" * 60)

print("Device:", device)

if device.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))
    print(
        "CUDA:",
        torch.version.cuda
    )

    props = torch.cuda.get_device_properties(0)

    print(
        "GPU Memory:",
        f"{props.total_memory / (1024**3):.2f} GB"
    )

print()


# ============================================================
# LOAD MODEL
# ============================================================

print("Loading DARC-Net...")

model = DARCNet().to(device)

checkpoint = torch.load(
    CHECKPOINT,
    map_location=device,
    weights_only=False
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.eval()

print("Model loaded.")
print("Checkpoint:", CHECKPOINT)
print("Checkpoint epoch:", checkpoint["epoch"])
print()


# ============================================================
# LOAD TEST FILES
# ============================================================

test_files = sorted(
    glob.glob(
        os.path.join(TEST_DIR, "*.npy")
    )
)

if not test_files:
    raise FileNotFoundError(
        f"No .npy files found in {TEST_DIR}"
    )

print("Test samples:", len(test_files))

# Use the first test image for latency benchmark
input_path = test_files[0]

print("Benchmark input:", input_path)

lr_array = np.load(input_path)

print("Input shape:", lr_array.shape)
print("Input dtype:", lr_array.dtype)

print()


# ============================================================
# PREPARE INPUT
# ============================================================

lr_tensor = torch.from_numpy(
    lr_array
).float()

# (128,128)
#     ↓
# (1,128,128)
lr_tensor = lr_tensor.unsqueeze(0)

# (1,128,128)
#     ↓
# (1,1,128,128)
lr_tensor = lr_tensor.unsqueeze(0)

lr_tensor = lr_tensor.to(device)


# ============================================================
# WARM-UP
# ============================================================

print(
    f"Running {WARMUP_RUNS} warm-up inference runs..."
)

with torch.no_grad():

    for _ in range(WARMUP_RUNS):

        _ = model(lr_tensor)


if device.type == "cuda":
    torch.cuda.synchronize()


print("Warm-up complete.")
print()


# ============================================================
# RESET GPU MEMORY STATS
# ============================================================

if device.type == "cuda":

    torch.cuda.empty_cache()

    torch.cuda.reset_peak_memory_stats()


# ============================================================
# BENCHMARK
# ============================================================

print(
    f"Running {BENCHMARK_RUNS} timed inference runs..."
)

times = []

with torch.no_grad():

    for _ in range(BENCHMARK_RUNS):

        if device.type == "cuda":
            torch.cuda.synchronize()

        start = time.perf_counter()

        _ = model(lr_tensor)

        if device.type == "cuda":
            torch.cuda.synchronize()

        end = time.perf_counter()

        times.append(
            end - start
        )


# ============================================================
# CALCULATE METRICS
# ============================================================

times = np.array(times)

average_latency = times.mean()

median_latency = np.median(times)

min_latency = times.min()

max_latency = times.max()

throughput = 1.0 / average_latency


# ============================================================
# GPU MEMORY
# ============================================================

if device.type == "cuda":

    peak_memory = (
        torch.cuda.max_memory_allocated()
        / (1024 ** 2)
    )

else:

    peak_memory = 0


# ============================================================
# FINAL OUTPUT
# ============================================================

print()
print("=" * 60)
print("BENCHMARK RESULTS")
print("=" * 60)

print(
    f"GPU:               {torch.cuda.get_device_name(0) if device.type == 'cuda' else 'CPU'}"
)

print(
    f"Input resolution:  {lr_array.shape[0]} × {lr_array.shape[1]}"
)

print(
    "Output resolution: 256 × 256"
)

print()

print(
    f"Runs:              {BENCHMARK_RUNS}"
)

print(
    f"Average latency:   {average_latency * 1000:.3f} ms"
)

print(
    f"Median latency:    {median_latency * 1000:.3f} ms"
)

print(
    f"Minimum latency:   {min_latency * 1000:.3f} ms"
)

print(
    f"Maximum latency:   {max_latency * 1000:.3f} ms"
)

print(
    f"Throughput:        {throughput:.3f} images/sec"
)

if device.type == "cuda":

    print(
        f"Peak GPU memory:   {peak_memory:.2f} MB"
    )

print("=" * 60)

print()
print("BENCHMARK COMPLETE")