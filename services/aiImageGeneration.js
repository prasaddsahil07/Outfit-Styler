import { ai } from "../index.js";

export const generateAIFashionSuggestions = async (occasion, numberOfImages = 3, description = "") => {
    try {
        // Build description section for the prompt
        const descriptionSection = description && description.trim() 
            ? `\n📝 ADDITIONAL STYLING REQUIREMENTS:\n- ${description.trim()}\n- Incorporate these specific preferences across all ${numberOfImages} outfits while maintaining variety\n- Balance user preferences with occasion appropriateness and outfit diversity\n- Let the description influence the overall aesthetic direction of all looks\n`
            : '';

        const aiPrompt = `
ROLE: You are a professional fashion stylist creating complete, full-body styled outfits for a fashion editorial campaign.

OBJECTIVE:
Design ${numberOfImages} distinct cohesive outfits perfect for a **${occasion}** setting. Create complete looks styled on models for a fashion campaign.
${descriptionSection}
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
${description && description.trim() ? `- Reflect the styling preferences: "${description.trim()}" in each of the ${numberOfImages} looks while maintaining distinct differences between them` : ''}

🖼️ VISUAL OUTPUT FORMAT:
- Each outfit styled on a photorealistic human **model**
- Professional editorial photography look – full-body model shots
- Clean and neutral background, natural light or soft studio lighting
- High-resolution fashion-forward appearance
- Show each complete outfit clearly and attractively
${description && description.trim() ? `- Ensure the overall visual aesthetic aligns with: "${description.trim()}"` : ''}

🚫 ABSOLUTE RULES:
- Generate exactly ${numberOfImages} distinct outfit looks
- No styling alternatives within each look
- No text overlays or descriptions on images
- Focus on showcasing realistic, wearable outfits
${description && description.trim() ? `- All outfits should harmonize with the user's style direction while being distinctly different from each other` : ''}

✨ GOAL:
Deliver ${numberOfImages} distinct and editorial-quality complete outfits suitable for the **${occasion}** setting, each styled professionally on a female model${description && description.trim() ? ` with styling that reflects: "${description.trim()}"` : ''}.
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
                    lookNumber: aiImageCount,
                    description: description || null
                });
            }
        }

        return {
            success: true,
            data: generatedImages,
            totalGenerated: generatedImages.length,
            message: `Successfully generated ${generatedImages.length} AI fashion suggestions${description && description.trim() ? ' with custom styling preferences' : ''}`,
            appliedDescription: description || null
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