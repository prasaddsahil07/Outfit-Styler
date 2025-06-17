import OpenAI from "openai";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function isFashionItem(imageUrl) {
    const messages = [{
        role: "user",
        content: [
            {
                type: "input_text",
                text: `You are an image validation assistant for a fashion styling app. 
                Given an image, determine if it contains a fashion item like topwear, bottomwear, dress, 
                footwear, or accessories. Respond with only:
                ✅ Valid Fashion Item 
                ❌ Not a Fashion Item`
            },
            { type: "input_image", image_url: imageUrl },
        ],
    }];

    const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: messages
    });

    return response.output_text.startsWith("✅");
}

export async function uploadAndValidateImages(files) {
    const imageUrls = [];
    const publicIds = [];

    for (const file of files) {
        const result = await uploadOnCloudinary(file.path);
        imageUrls.push(result);
        // publicIds.push(result.public_id);

        const valid = await isFashionItem(result);
        if (!valid) {
            return {
                error: `One or more images do not appear to contain valid fashion items.`,
                imageUrls,
                // publicIds,
            };
        }
    }

    return { imageUrls };
}
