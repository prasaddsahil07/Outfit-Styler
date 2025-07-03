import { ai } from "../index.js";
import { createUserContent } from "@google/genai";

// Convert image URL to base64 inline data
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

export async function analyzeGeneratedAndBadImages(results, badImages, occasion) {
    try {
        const prompt = `You are a professional fashion AI analyst. Analyze the provided images and provide detailed insights.

CONTEXT:
- Occasion: "${occasion}"
- You will receive generated fashion images and bad/unsuitable images
- For generated images: provide brief descriptions and fashion keywords
- For bad images: explain why they're inappropriate for the occasion and suggest suitable alternatives

ANALYSIS REQUIREMENTS:

FOR GENERATED IMAGES:
- Provide a brief, engaging description (2-3 sentences)
- Generate 5-8 relevant fashion keywords (garments, footwear, accessories only)
- Keywords should be specific and searchable (e.g., "blazer", "ankle boots", "statement necklace")

FOR BAD IMAGES:
- Explain why the item is unsuitable for "${occasion}" (2-3 sentences)
- Generate 5-8 fashion keywords based on what WOULD be suitable for "${occasion}"
- Focus on alternative items that would work better

RESPONSE FORMAT:
Respond only in valid JSON format with analysis for each image in order:
{
    "generatedImages": [
        {
            "brief": "string",
            "keywords": ["keyword1", "keyword2", "..."]
        }
    ],
    "badImages": [
        {
            "reasoning": "string",
            "keywords": ["keyword1", "keyword2", "..."]
        }
    ]
}

GUIDELINES:
- Keywords must be fashion items only (clothing, shoes, accessories, bags, jewelry)
- Keep descriptions concise but informative
- Focus on style, occasion-appropriateness, and key fashion elements
- Use specific fashion terminology
- Ensure all keywords are searchable fashion terms

Analyze the images now:`;

        const parts = [{ text: prompt }];

        // Add generated images (results array)
        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result && (result.imageUrl || result.imageB64)) {
                    const imageUrl = result.imageUrl || result.imageB64;
                    if (imageUrl) {
                        try {
                            const imageData = await fetchImageAsBase64(imageUrl);
                            parts.push({
                                inlineData: imageData
                            });
                        } catch (error) {
                            console.error(`Error processing generated image ${i}:`, error);
                        }
                    }
                }
            }
        }

        // Add bad images
        if (badImages && badImages.length > 0) {
            for (let i = 0; i < badImages.length; i++) {
                const badImage = badImages[i];
                if (badImage && badImage.imageUrl) {
                    try {
                        const imageData = await fetchImageAsBase64(badImage.imageUrl);
                        parts.push({
                            inlineData: imageData
                        });
                    } catch (error) {
                        console.error(`Error processing bad image ${i}:`, error);
                    }
                }
            }
        }

        const contents = createUserContent(parts);
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-thinking-exp',
            contents: [contents],
            config: {
                temperature: 0.2,
                topP: 0.8,
                topK: 40,
            },
        });

        const response = JSON.parse(result.candidates[0].content.parts[0].text);
        
        // Merge the AI analysis with the actual image data
        const enhancedResponse = {
            generatedImages: [],
            badImages: []
        };

        // Process generated images - merge AI analysis with actual image data
        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result && (result.imageUrl || result.imageB64)) {
                    const analysisData = response.generatedImages[enhancedResponse.generatedImages.length] || {};
                    enhancedResponse.generatedImages.push({
                        ...result, // Include original image data
                        brief: analysisData.brief || "",
                        keywords: analysisData.keywords || []
                    });
                }
            }
        }

        // Process bad images - merge AI analysis with actual image data
        if (badImages && badImages.length > 0) {
            for (let i = 0; i < badImages.length; i++) {
                const badImage = badImages[i];
                if (badImage && badImage.imageUrl) {
                    const analysisData = response.badImages[i] || {};
                    enhancedResponse.badImages.push({
                        ...badImage, // Include original image data
                        reasoning: analysisData.reasoning || "",
                        keywords: analysisData.keywords || []
                    });
                }
            }
        }

        return enhancedResponse;

    } catch (error) {
        console.error("Error in analyzeGeneratedAndBadImages:", error);
        throw error;
    }
}