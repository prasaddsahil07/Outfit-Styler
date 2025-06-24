import {ai} from "../index.js";


export const generateImageForOccasion = async (req, res) => {
    try {
        const { occasion } = req.query;

        if (!occasion) {
            return res.status(400).json({ error: "Missing occasion" });
        }

        const prompt = `
ROLE: You are a professional fashion stylist creating complete, full-body styled outfits for a fashion editorial campaign.

OBJECTIVE:
Design a cohesive outfit perfect for a **${occasion}** setting. Create a single complete look styled on a model for a fashion campaign.

✅ OUTFIT STRUCTURE:
- Include EXACTLY ONE complete outfit with:
  - One topwear (shirt, blouse, t-shirt, sweater, etc.)
  - One bottomwear (pants, skirt, shorts, etc.) OR a dress (if dress, no separate top/bottom needed)
  - One pair of shoes
  - 2–3 accessories (bag, hat, jewelry, belt, scarf – choose what fits the occasion)
- NO duplicates or alternate options – only one complete look

🎨 STYLING FOCUS:
- The outfit must be appropriate and stylish for **${occasion}**
- Consider the formality level, color palette, and style that suits this occasion
- Focus on creating a cohesive, well-coordinated look
- Ensure all pieces work harmoniously together

🖼️ VISUAL OUTPUT FORMAT:
- The final outfit should be styled on a photorealistic human **model**
- Professional editorial photography look – full-body model shot
- Clean and neutral background, natural light or soft studio lighting
- High-resolution fashion-forward appearance
- Show the complete outfit clearly and attractively

🚫 ABSOLUTE RULES:
- Only ONE complete outfit
- No styling alternatives or multiple options
- No text overlays or descriptions on the image
- Focus on showcasing a realistic, wearable outfit

✨ GOAL:
Deliver a distinct and editorial-quality complete outfit suitable for the **${occasion}** setting, styled professionally on a model.
`;

        const results = [];

        // Set responseModalities to include "Image" so the model can generate  an image
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: prompt,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
                numberOfImages: 3,
            },
        });

        for (const part of response.candidates[0].content.parts) {
            // Based on the part type, either show the text or save the image
            if (part.text) {
                console.log(part.text);
            } else if (part.inlineData) {
                const imageData = part.inlineData.data;
                // const buffer = Buffer.from(imageData, "base64");
                results.push(imageData);
                console.log("Image saved as gemini-native-image.png");
            }
        }
        
        return res.status(200).json({
            message: "Images created successfully",
            results,
            occasion: occasion
        });

    } catch (err) {
        console.error("Generation error:", err.message);
        res.status(500).json({
            error: "Image generation failed",
            details: err.message
        });
    }
};