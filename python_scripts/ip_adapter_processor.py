import base64
import io
from PIL import Image
import torch
from diffusers import AutoPipelineForImage2Image
from diffusers.utils import load_image
import numpy as np

# Initialize pipeline
pipeline = AutoPipelineForImage2Image.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0", 
    torch_dtype=torch.float16
).to("cuda")

# Load IP-Adapter
pipeline.load_ip_adapter("h94/IP-Adapter", subfolder="sdxl_models", weight_name="ip-adapter_sdxl.bin")

def process_image(image_base64):
    # Decode image
    image_data = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # Define outfit styles
    outfit_prompts = [
        "professional business suit, high quality, detailed tailoring",
        "casual streetwear, trendy, urban fashion",
        "evening gown, elegant, luxury fashion"
    ]
    
    # Style references (pre-loaded or use the same image)
    style_refs = [
        load_image("https://example.com/business_ref.jpg"),
        load_image("https://example.com/streetwear_ref.jpg"),
        load_image("https://example.com/gown_ref.jpg")
    ]
    
    results = []
    
    for prompt, style_ref in zip(outfit_prompts, style_refs):
        pipeline.set_ip_adapter_scale(0.6)
        
        # Generate styled image
        result = pipeline(
            prompt=prompt,
            image=image,
            ip_adapter_image=style_ref,
            strength=0.5,  # Retain original pose
            guidance_scale=7.0,
            num_inference_steps=30
        ).images[0]
        
        # Convert to base64
        buffered = io.BytesIO()
        result.save(buffered, format="PNG")
        results.append(base64.b64encode(buffered.getvalue()).decode('utf-8'))
    
    return results

if __name__ == "__main__":
    import sys
    import json
    
    image_base64 = sys.stdin.read().strip()
    styled_images = process_image(image_base64)
    print(json.dumps(styled_images))