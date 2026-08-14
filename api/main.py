from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from api.inference import restore_image


app = FastAPI(
    title="KLA AI Image Restoration API",
    description="DARC-Net based degraded image restoration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():

    return {
        "project": "KLA AI Image Restoration",
        "model": "DARC-Net + Combined Loss",
        "status": "running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.post("/restore")
async def restore(
    file: UploadFile = File(...)
):

    image_bytes = await file.read()

    output_buffer, original_size = restore_image(
        image_bytes
    )

    return StreamingResponse(
        output_buffer,
        media_type="image/png",
        headers={
            "X-Original-Width": str(original_size[0]),
            "X-Original-Height": str(original_size[1]),
            "X-Output-Width": "256",
            "X-Output-Height": "256"
        }
    )