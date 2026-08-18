import sys
from pathlib import Path

import numpy as np
import torch

from src.darc_net import DARCNet


CHECKPOINT_PATH = Path("weights/darc_losses_best.pth")


def load_model(device):
    print(f"Loading DARC-Net on {device}...")

    model = DARCNet().to(device)

    checkpoint = torch.load(
        CHECKPOINT_PATH,
        map_location=device,
        weights_only=False,
    )

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)
    model.eval()

    print("Model loaded successfully.")

    return model


def restore_file(model, input_path, output_path, device):
    # --------------------------------------------------
    # Load KLA .npy input
    # --------------------------------------------------
    array = np.load(input_path)

    if array.ndim != 2:
        raise ValueError(
            f"{input_path.name}: expected 2D array (H,W), "
            f"got shape {array.shape}"
        )

    if array.shape != (128, 128):
        raise ValueError(
            f"{input_path.name}: expected input shape (128,128), "
            f"got {array.shape}"
        )

    if not np.isfinite(array).all():
        raise ValueError(
            f"{input_path.name}: input contains NaN or Inf"
        )

    # IMPORTANT:
    # Do NOT normalize or clip NoisyLR.
    tensor = torch.from_numpy(
        array.astype(np.float32, copy=False)
    )

    # (128,128) -> (1,1,128,128)
    tensor = tensor.unsqueeze(0).unsqueeze(0).to(device)

    # --------------------------------------------------
    # DARC-Net inference
    # --------------------------------------------------
    with torch.no_grad():
        output = model(tensor)

    # Expected: (1,1,256,256)
    if output.ndim != 4:
        raise RuntimeError(
            f"{input_path.name}: unexpected model output shape "
            f"{tuple(output.shape)}"
        )

    output = output.squeeze(0).squeeze(0)

    # --------------------------------------------------
    # Validate output
    # --------------------------------------------------
    if output.shape != (256, 256):
        raise RuntimeError(
            f"{input_path.name}: expected output shape (256,256), "
            f"got {tuple(output.shape)}"
        )

    output = output.float()

    if not torch.isfinite(output).all():
        raise RuntimeError(
            f"{input_path.name}: model output contains NaN or Inf"
        )

    # KLA requires output values in [0,1].
    output = torch.clamp(output, 0.0, 1.0)

    # GPU -> CPU -> NumPy
    output_array = output.cpu().numpy().astype(
        np.float32,
        copy=False
    )

    # Final safety check
    if not np.isfinite(output_array).all():
        raise RuntimeError(
            f"{input_path.name}: final output contains NaN or Inf"
        )

    if output_array.min() < 0.0 or output_array.max() > 1.0:
        raise RuntimeError(
            f"{input_path.name}: output outside [0,1]"
        )

    # --------------------------------------------------
    # Save using EXACT same filename
    # --------------------------------------------------
    np.save(output_path, output_array)


def main():
    if len(sys.argv) != 3:
        print(
            "Usage:\n"
            "  python run.py <input-dir> <output-dir>"
        )
        sys.exit(1)

    input_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])

    if not input_dir.exists():
        print(f"ERROR: input directory does not exist: {input_dir}")
        sys.exit(1)

    if not input_dir.is_dir():
        print(f"ERROR: input path is not a directory: {input_dir}")
        sys.exit(1)

    # Create output directory if needed.
    output_dir.mkdir(parents=True, exist_ok=True)

    input_files = sorted(input_dir.glob("*.npy"))

    if not input_files:
        print(f"ERROR: no .npy files found in {input_dir}")
        sys.exit(1)

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    print("=" * 60)
    print("KLA DARC-NET RESTORATION")
    print("=" * 60)
    print(f"Input directory : {input_dir}")
    print(f"Output directory: {output_dir}")
    print(f"Input files     : {len(input_files)}")
    print(f"Device          : {device}")

    if device.type == "cuda":
        print(f"GPU             : {torch.cuda.get_device_name(0)}")

    print("=" * 60)

    if not CHECKPOINT_PATH.exists():
        print(
            f"ERROR: checkpoint not found: {CHECKPOINT_PATH}"
        )
        sys.exit(1)

    model = load_model(device)

    successful = 0

    for index, input_path in enumerate(input_files, start=1):
        output_path = output_dir / input_path.name

        try:
            restore_file(
                model,
                input_path,
                output_path,
                device,
            )

            successful += 1
            print(
                f"[{index}/{len(input_files)}] "
                f"{input_path.name} -> OK"
            )

        except Exception as exc:
            print(
                f"[{index}/{len(input_files)}] "
                f"{input_path.name} -> FAILED: {exc}"
            )
            raise

    print("=" * 60)
    print("RESTORATION COMPLETE")
    print(f"Successful: {successful}/{len(input_files)}")
    print(f"Outputs   : {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()