import { ai } from "../index.js";
import { createUserContent } from "@google/genai";

// convert an image URL to base64 inline data
async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/png";
        return {
            mimeType: contentType,
            data: Buffer.from(buffer).toString("base64"),
        };
    } catch (error) {
        console.error(`Error fetching image from ${url}:`, error);
        throw error;
    }
}

export async function analyzeImage(imageUrl) {
    const prompt = `You're a fashion AI. 
Given an image, identify:

1. Does it contain any clothing, footwear, or accessories?
2. Does it contain a full-body human?
3. If yes to full-body, generate a fashion-style title/caption for the look.

Respond in JSON like:
{

  "containsFashionItem": true/false,
  "containsFullBodyHuman": true/false,
  "generatedTitle": "..." // only if full-body
}`;

    const parts = [
        { text: prompt },
        {
            inlineData: {
                mimeType: 'image/jpeg',
                data: await fetchImageAsBase64(imageUrl)
            }
        }
    ];

    const contents = createUserContent(parts);
    const result = await ai.models.generateContent({
        model: 'gemini-2.0-pro',
        contents: [contents],
        config: { temperature: 0.3 }
    });

    const response = JSON.parse(result.candidates[0].content.parts[0].text);
    return response;
}
