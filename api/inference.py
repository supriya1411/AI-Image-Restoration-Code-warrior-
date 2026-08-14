import io
import numpy as np
import torch
from PIL import Image

from src.darc_net import DARCNet


DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

CHECKPOINT_PATH = "weights/darc_losses_best.pth"


# --------------------------------------------------
# Load model ONCE when API starts
# --------------------------------------------------

print("Loading DARC-Net...")

model = DARCNet().to(DEVICE)

checkpoint = torch.load(
    CHECKPOINT_PATH,
    map_location=DEVICE,
    weights_only=False
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.eval()

print("DARC-Net loaded.")
print("Device:", DEVICE)


# --------------------------------------------------
# Image → Tensor
# --------------------------------------------------

def image_to_tensor(image_bytes: bytes):

    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("L")

    original_size = image.size

    # DARC-Net expects 128 × 128 input
    image = image.resize(
        (128, 128),
        Image.Resampling.BICUBIC
    )

    arr = np.asarray(
        image,
        dtype=np.float32
    )

    # Convert 8-bit image to [0,1]
    arr = arr / 255.0

    tensor = torch.from_numpy(arr)

    tensor = tensor.unsqueeze(0).unsqueeze(0)

    tensor = tensor.to(DEVICE)

    return tensor, original_size


# --------------------------------------------------
# Run restoration
# --------------------------------------------------

@torch.no_grad()
def restore_image(image_bytes: bytes):

    tensor, original_size = image_to_tensor(
        image_bytes
    )

    output = model(tensor)

    # Model output: (1, 1, 256, 256)
    output = output.squeeze(0).squeeze(0)

    # For image display/storage only
    output = torch.clamp(
        output,
        0.0,
        1.0
    )

    output = (
        output.cpu()
        .numpy() * 255.0
    ).astype(np.uint8)

    output_image = Image.fromarray(
        output,
        mode="L"
    )

    buffer = io.BytesIO()

    output_image.save(
        buffer,
        format="PNG"
    )

    buffer.seek(0)

    return buffer, original_size