# AI-Image-Restoration-Code-warrior-
# DARC-Net — Degradation-Aware Image Restoration

A degradation-aware deep learning pipeline for restoring noisy, low-resolution semiconductor microscopy images to high-resolution ground-truth quality.

The project is designed for semiconductor inspection scenarios where image degradation can obscure important structural details and defects. DARC-Net learns to reconstruct a high-resolution image from a degraded low-resolution input while preserving fine image structures.

---

## Problem

Semiconductor microscopy images can suffer from:

* Speckle noise
* Gaussian-like noise
* Low-resolution / downsampling degradation
* Loss of fine structural details
* Reduced image quality during acquisition

The objective is to transform a degraded **128 × 128 NoisyLR** image into a restored **256 × 256** image that is close to the corresponding ground-truth image.

```text
NoisyLR Image
128 × 128
     │
     ▼
┌─────────────────────┐
│      DARC-Net       │
│ Degradation-Aware   │
│ Restoration Network │
└─────────────────────┘
     │
     ▼
Restored Image
256 × 256
```

---

## Key Objectives

The system is evaluated on three major aspects:

### 1. Restoration Quality

Measured using:

* **PSNR ↑** — higher is better
* **SSIM ↑** — higher is better
* **LPIPS ↓** — lower is better

### 2. End-to-End Inference Efficiency

The inference pipeline can be benchmarked on GPU hardware using:

* Input resolution
* Output resolution
* Batch size
* Inference latency
* Images per second
* GPU memory / execution information

The repository includes the benchmark implementation and recorded benchmark result.

### 3. Training and Experiment Reproducibility

The repository tracks:

* Dataset split
* Random split seed
* Training hyperparameters
* Model configuration
* Loss configuration
* Optimizer
* Checkpoints
* Evaluation scripts
* Environment information

See:

`configs/final_config.yaml`

for the configuration record corresponding to the submitted checkpoint.

---

# Architecture

DARC-Net follows a degradation-aware restoration pipeline:

```text
Input NoisyLR
     │
     ▼
Degradation / Feature Analysis
     │
     ▼
Feature Extraction
     │
     ▼
Degradation-Aware Restoration
     │
     ▼
2× Super-Resolution
     │
     ▼
Residual Reconstruction
     │
     ▼
Restored HR Image
```

The implementation is located in:

```text
src/darc_net.py
```

---

# Model Configuration

The submitted checkpoint was trained using the default DARC-Net configuration:

| Parameter            |     Value |
| -------------------- | --------: |
| Input channels       |         1 |
| Output channels      |         1 |
| Feature channels     |        64 |
| Number of blocks     |         8 |
| Embedding dimension  |        32 |
| Trainable parameters |   892,577 |
| Input resolution     | 128 × 128 |
| Output resolution    | 256 × 256 |

---

# Training Configuration

The submitted checkpoint was produced by:

```text
train_darc_losses.py
```

Training configuration:

| Parameter           |    Value |
| ------------------- | -------: |
| Batch size          |        4 |
| Epochs              |       10 |
| Optimizer           |    AdamW |
| Learning rate       | 2 × 10⁻⁴ |
| Weight decay        | 1 × 10⁻⁴ |
| Validation fraction |    12.5% |
| Split seed          |       42 |
| Data augmentation   |     None |

The best validation checkpoint is:

```text
weights/darc_losses_best.pth
```

---

# Loss Function

The training loss used for the submitted checkpoint combines:

```text
Total Loss
    │
    ├── Charbonnier Loss
    ├── SSIM Loss
    └── Gradient Loss
```

Configuration:

| Component   | Weight |
| ----------- | -----: |
| Charbonnier |    1.0 |
| SSIM        |    0.1 |
| Gradient    |    0.1 |

### Important implementation note

The original DARC-Net design included a degradation-consistency loss concept.

However, **the degradation-consistency term was not included in the loss function used to train the submitted checkpoint**.

The submitted checkpoint was trained using Charbonnier + SSIM + Gradient losses only.

This is explicitly recorded in:

```text
configs/final_config.yaml
```

---

# Dataset

The training pipeline expects paired degraded and ground-truth samples.

```text
TRAIN/
├── GT/
│   ├── ...
│
└── NoisyLR/
    ├── ...
```

Each pair contains:

```text
NoisyLR  →  GT
128×128     256×256
```

The dataset contains approximately **3,200 paired samples**.

The repository does **not** include the training dataset.

Dataset splitting is implemented in:

```text
src/data_split.py
```

with:

```text
Validation fraction = 0.125
Split seed           = 42
```

---

# Evaluation Results

The submitted DARC-Net checkpoint was evaluated on the held-out validation set.

### DARC-Net

| Metric      |         Result |
| ----------- | -------------: |
| **PSNR** ↑  | **25.4332 dB** |
| **SSIM** ↑  |     **0.7710** |
| **LPIPS** ↓ |     **0.2565** |

These values are produced by the repository evaluation pipeline and stored under:

```text
results/darc_full_eval/
```

The detailed per-image measurements are available in:

```text
results/darc_full_eval/per_image_metrics.csv
```

Summary:

```text
results/darc_full_eval/summary.json
results/darc_full_eval/summary.txt
```

---

# Baseline Comparison

A baseline CNN was trained and evaluated using the same validation split.

### Results

| Model        |      PSNR ↑ |     SSIM ↑ |    LPIPS ↓ |
| ------------ | ----------: | ---------: | ---------: |
| BaselineCNN  |     23.6653 |     0.6702 |     0.4966 |
| **DARC-Net** | **25.4332** | **0.7710** | **0.2565** |

Comparison files:

```text
results/comparisons/comparison_table.csv
results/comparisons/comparison_table.txt
```

The baseline checkpoint is:

```text
weights/baseline_best.pth
```

---

# Inference

The main inference entry point is:

```text
inference.py
```

It supports directory-based inference using the required input/output interface.

Example:

```bash
python inference.py \
    --input_dir <INPUT_DIRECTORY> \
    --output_dir <OUTPUT_DIRECTORY> \
    --checkpoint weights/darc_losses_best.pth
```

Optional arguments include:

```text
--batch_size
--device
--save_png
```

The pipeline performs:

```text
Input NoisyLR
      ↓
DARC-Net
      ↓
Restored HR Output
      ↓
Output Directory
```

---

# Single Image Inference

Additional inference utilities are provided for image-based testing:

```text
inference_image.py
inference_npy.py
inference_test.py
```

These scripts are useful for validating the model on individual samples and different input formats.

---

# Benchmarking

End-to-end inference benchmarking is implemented in:

```text
benchmark.py
scripts/benchmark_e2e.py
```

The benchmark measures the inference pipeline rather than only model quality.

The recorded benchmark result is stored at:

```text
results/benchmark/benchmark_result.json
```

### Hardware note

The development training and validation environment used:

```text
NVIDIA GeForce RTX 3050 Laptop GPU
CUDA 12.1
PyTorch 2.5.1+cu121
Python 3.12.10
Windows 11
```

An NVIDIA H100 is intended for the final high-throughput evaluation environment. **H100 throughput numbers are not fabricated or claimed from the RTX 3050 benchmark.**

---

# Reproducibility

The repository contains a configuration record:

```text
configs/final_config.yaml
```

which documents the configuration that produced:

```text
weights/darc_losses_best.pth
```

### Random seed note

The original training run that produced the submitted checkpoint did not explicitly call:

```python
torch.manual_seed()
torch.cuda.manual_seed_all()
```

The dataset train/validation split itself was reproducible using:

```text
seed = 42
```

A seed fix has been added to the training script for future reproducible runs.

This does not modify the already-trained submitted checkpoint.

---

# Repository Structure

```text
AI-Image-Restoration-Code-warrior/
│
├── api/
│   ├── inference.py
│   └── main.py
│
├── configs/
│   └── final_config.yaml
│
├── frontend/
│   └── ...
│
├── results/
│   ├── baseline_full_eval/
│   ├── darc_full_eval/
│   ├── comparisons/
│   ├── benchmark/
│   └── inspection_report/
│
├── scripts/
│   ├── benchmark_e2e.py
│   ├── compare_results.py
│   ├── evaluate_baseline_full.py
│   ├── evaluate_darc_full.py
│   └── inspect_dataset.py
│
├── src/
│   ├── darc_net.py
│   ├── baseline_model.py
│   ├── dataset.py
│   ├── data_split.py
│   ├── losses.py
│   └── metrics.py
│
├── weights/
│   ├── baseline_best.pth
│   └── darc_losses_best.pth
│
├── benchmark.py
├── inference.py
├── inference_image.py
├── inference_npy.py
├── train_baseline.py
├── train_darc.py
├── train_darc_losses.py
├── requirements.txt
└── README.md
```

---

# Installation

Create a Python environment and install the required dependencies:

```bash
pip install -r requirements.txt
```

For GPU inference/training, install a compatible PyTorch build for the target CUDA environment.

---

# Verification

Basic model and loss tests are provided:

```bash
python test_darc_net.py
python test_losses.py
```

API verification:

```bash
python test_api.py
```

---

# Outputs

The repository contains evaluation evidence including:

* Restoration examples
* Best-performing samples
* Worst-performing samples
* Per-image PSNR / SSIM / LPIPS measurements
* Aggregate evaluation summaries
* Baseline comparison
* Benchmark result
* Dataset inspection statistics

Generated bulk inference outputs and training datasets are intentionally excluded from Git to keep the repository manageable.

---

# Demo Frontend

A frontend demonstration is included under:

```text
frontend/
```

The frontend provides a visual interface for demonstrating the restoration pipeline.

It is a **demonstration layer** and does not replace the official command-line inference/evaluation pipeline used for reproducibility and benchmarking.

The core ML system can be evaluated independently through the Python inference and evaluation scripts.

---

# Reproducible Evaluation Pipeline

The intended evaluation workflow is:

```text
Dataset
   │
   ├───────────────┐
   │               │
   ▼               ▼
NoisyLR           GT
   │               │
   ▼               │
DARC-Net            │
   │               │
   ▼               │
Restored ───────────┘
   │
   ▼
PSNR / SSIM / LPIPS
```

For efficiency evaluation:

```text
NoisyLR
   │
   ▼
DARC-Net
   │
   ▼
Restored HR
   │
   ▼
Latency / Throughput / GPU measurement
```

---

# Project Status

Core ML pipeline:

* ✅ DARC-Net architecture
* ✅ Paired dataset loader
* ✅ Train/validation split
* ✅ Training pipeline
* ✅ Restoration loss
* ✅ Submitted checkpoint
* ✅ Inference pipeline
* ✅ PSNR / SSIM / LPIPS evaluation
* ✅ Baseline comparison
* ✅ Benchmark implementation
* ✅ Reproducibility configuration
* ✅ Evaluation artifacts
* ✅ GPU inference support
* ✅ Optional frontend demonstration

---

## Final Model

**DARC-Net**

```text
128×128 NoisyLR
       ↓
   DARC-Net
       ↓
256×256 Restored Image
```

Submitted checkpoint:

```text
weights/darc_losses_best.pth
```

Validation performance:

```text
PSNR  = 25.4332 dB
SSIM  = 0.7710
LPIPS = 0.2565
```

The repository contains the complete training, inference, evaluation, benchmarking, model configuration, checkpoint, and supporting demonstration code required to reproduce and inspect the system.
