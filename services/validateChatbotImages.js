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

export async function validateChatbotImage(imageUrl, userQuery = '') {
    const contextualGuidance = userQuery
        ? `\n\nUSER CONTEXT: "${userQuery}"\nWhen generating the fashion title, consider this user input to provide relevant context and perspective. Tailor the title to align with what the user is asking about or looking for.`
        : '';

    const prompt = `You are a professional fashion AI analyst. Analyze this image carefully and provide the following information:

ANALYSIS CRITERIA:
1. Fashion Items: Look for any clothing, footwear, accessories, or fashion-related items (including bags, jewelry, hats, etc.)
2. Full-Body Human: Determine if there's a complete human figure visible from head to toe (or head to feet if wearing shoes)
3. Fashion Title: If a full-body human is present, create an engaging, descriptive fashion title that captures the overall style, aesthetic, and key elements of the outfit

RESPONSE FORMAT:
Respond only in valid JSON format with these exact keys:
{
    "containsFashionItem": boolean,
    "containsFullBodyHuman": boolean,
    "generatedTitle": string or null
}

GUIDELINES:
- Set "containsFashionItem" to true if ANY fashion-related item is visible
- Set "containsFullBodyHuman" to true only if you can see a person's complete silhouette from head to feet
- Only provide "generatedTitle" if "containsFullBodyHuman" is true
- If no full-body human, set "generatedTitle" to null
- Fashion titles should be creative, descriptive, and capture the mood/style (e.g., "Effortless Chic: Minimalist Elegance in Neutral Tones")${contextualGuidance}

Analyze the image now:`;

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
        model: 'gemini-2.0-flash-thinking-exp',
        contents: [contents],
        config: {
            temperature: 0.1,
            topP: 0.8,
            topK: 40,
        },
    });

    const response = JSON.parse(result.candidates[0].content.parts[0].text);
    return response;
}