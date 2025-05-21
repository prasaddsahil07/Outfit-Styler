import sys
import json
import io
import base64
import numpy as np
from PIL import Image
import torch
from transformers import (
    CLIPProcessor,
    CLIPModel,
    CLIPSegProcessor,
    CLIPSegForImageSegmentation
)

# Load models only once
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

seg_model = CLIPSegForImageSegmentation.from_pretrained("CIDAS/clipseg-rd64-refined")
seg_processor = CLIPSegProcessor.from_pretrained("CIDAS/clipseg-rd64-refined")


def segment_part(image: Image.Image, label: str) -> Image.Image:
    inputs = seg_processor(text=[label], images=image, return_tensors="pt")
    outputs = seg_model(**inputs)
    # Handle both old and new versions of transformers
    mask = outputs.logits[0] if hasattr(outputs, 'logits') else outputs.predictions[0]
    mask = mask.squeeze().detach().numpy()
    # Resize mask to match image dimensions
    mask = (mask > 0.5).astype(np.uint8)
    mask = Image.fromarray(mask).resize(image.size)  # Resize to original image size
    
    # Convert back to numpy and apply
    mask = np.array(mask)
    image_np = np.array(image)
    masked = image_np * mask[:, :, None]  # Add channel dimension to mask
    return Image.fromarray(masked)


def to_base64(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()

def process_image(image_data_base64: str, category: str):
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_data_base64)
        image_pil = Image.open(io.BytesIO(image_data)).convert("RGB")

        if category == "both":
            top = segment_part(image_pil, "topwear")
            bottom = segment_part(image_pil, "bottomwear")
            return {
                "detected_category": "both",
                "images": [to_base64(top), to_base64(bottom)]
            }
        elif category in ["topwear", "bottomwear"]:
            segmented = segment_part(image_pil, category)
            return {
                "detected_category": category,
                "images": [to_base64(segmented)]
            }
        else:
            return {
                "detected_category": "unknown",
                "images": [to_base64(image_pil)]
            }

    except Exception as e:
        return {"error": str(e)}




def main():
    # import sys
    raw_input = sys.stdin.read()
    try:
        data = json.loads(raw_input)
        image_data = data["image"]
        category = data["category"]
        result = process_image(image_data, category)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))



if __name__ == "__main__":
    main()
