from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from transformers import CLIPProcessor, CLIPModel, CLIPSegProcessor, CLIPSegForImageSegmentation
from PIL import Image
import torch
import numpy as np
import io
import base64

app = FastAPI()

# Enable CORS (for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

seg_model = CLIPSegForImageSegmentation.from_pretrained("CIDAS/clipseg-rd64-refined")
seg_processor = CLIPSegProcessor.from_pretrained("CIDAS/clipseg-rd64-refined")

# Helpers
def detect_category(image: Image.Image) -> str:
    labels = ["topwear", "bottomwear", "both", "one-piece"]
    texts = [f"A person wearing {label}" for label in labels]
    inputs = clip_processor(text=texts, images=image, return_tensors="pt", padding=True)
    outputs = clip_model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)[0]
    best_idx = probs.argmax().item()
    return labels[best_idx]

def segment_part(image: Image.Image, label: str) -> Image.Image:
    inputs = seg_processor(text=[label], images=image, return_tensors="pt")
    outputs = seg_model(**inputs)
    mask = outputs.predictions[0].squeeze().detach().numpy()
    mask = (mask > 0.5).astype(np.uint8)
    image_np = np.array(image)
    masked = image_np * mask[:, :, None]
    return Image.fromarray(masked)

def to_base64(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()

@app.post("/process/")
async def process_image(image: UploadFile = File(...)):
    image_data = await image.read()
    image_pil = Image.open(io.BytesIO(image_data)).convert("RGB")

    # Step 1: Predict category
    category = detect_category(image_pil)

    # Step 2: Segment or return based on category
    if category == "both":
        top = segment_part(image_pil, "topwear")
        bottom = segment_part(image_pil, "bottomwear")
        return {
            "detected_category": "both",
            "topwear": to_base64(top),
            "bottomwear": to_base64(bottom)
        }
    else:
        return {
            "detected_category": category,
            "image": to_base64(image_pil)
        }
