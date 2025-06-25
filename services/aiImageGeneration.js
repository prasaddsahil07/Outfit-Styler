import { ai } from "../index.js";

export const generateAIFashionSuggestions = async (occasion, numberOfImages = 3) => {
    try {
        const aiPrompt = `
ROLE: You are a professional fashion stylist creating complete, full-body styled outfits for a fashion editorial campaign.

OBJECTIVE:
Design ${numberOfImages} distinct cohesive outfits perfect for a **${occasion}** setting. Create complete looks styled on models for a fashion campaign.

✅ OUTFIT STRUCTURE (for each look):
- Include EXACTLY ONE complete outfit with:
  - One topwear (shirt, blouse, t-shirt, sweater, etc.)
  - One bottomwear (pants, skirt, shorts, etc.) OR a dress (if dress, no separate top/bottom needed)
  - One pair of shoes
  - 2–3 accessories (bag, hat, jewelry, belt, scarf – choose what fits the occasion)

🎨 STYLING FOCUS:
- Each outfit must be appropriate and stylish for **${occasion}**
- Make each look distinctly different in style, color palette, and approach
- Consider the formality level and aesthetic that suits this occasion
- Focus on creating cohesive, well-coordinated looks
- Ensure variety between the ${numberOfImages} different outfits

🖼️ VISUAL OUTPUT FORMAT:
- Each outfit styled on a photorealistic human **model**
- Professional editorial photography look – full-body model shots
- Clean and neutral background, natural light or soft studio lighting
- High-resolution fashion-forward appearance
- Show each complete outfit clearly and attractively

🚫 ABSOLUTE RULES:
- Generate exactly ${numberOfImages} distinct outfit looks
- No styling alternatives within each look
- No text overlays or descriptions on images
- Focus on showcasing realistic, wearable outfits

✨ GOAL:
Deliver ${numberOfImages} distinct and editorial-quality complete outfits suitable for the **${occasion}** setting, each styled professionally on a female model.
`;

        const aiResponse = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: aiPrompt,
            config: {
                responseModalities: ["TEXT", "IMAGE"],
                numberOfImages: numberOfImages,
            },
        });

        // Extract AI generated images
        const generatedImages = [];
        let aiImageCount = 0;
        
        for (const part of aiResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                aiImageCount++;
                generatedImages.push({
                    type: 'ai_suggestion',
                    imageB64: part.inlineData.data,
                    lookNumber: aiImageCount
                });
            }
        }

        return {
            success: true,
            data: generatedImages,
            totalGenerated: generatedImages.length,
            message: `Successfully generated ${generatedImages.length} AI fashion suggestions`
        };

    } catch (error) {
        console.error('Error generating AI fashion suggestions:', error);
        return {
            success: false,
            error: error.message,
            data: [],
            totalGenerated: 0,
            message: 'Failed to generate AI fashion suggestions'
        };
    }
};