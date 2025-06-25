import { ai } from "../index.js";
import { DigitalWardrobe } from "../models/digitalWardrobe.models.js";

const getGarmentsFromWardrobe = async (req, occasion) => {
    try {
        const userId = req.user._id;

        if (!occasion) return [];

        const wardrobe = await DigitalWardrobe.findOne({ userId });

        if (!wardrobe || wardrobe.uploadedImages.length === 0) {
            return [];
        }

        const result = wardrobe.uploadedImages
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .flatMap(image =>
                image.garments
                    .filter(g => g.occasion.includes(occasion))
                    .map(g => ({
                        imageId: image._id,
                        itemName: g.itemName,
                        imageUrl: image.imageUrl,
                        createdAt: image.createdAt,
                    }))
            );

        return result;
    } catch (err) {
        console.error('Error fetching by occasion:', err);
        return [];
    }
};

// Helper function to convert image URL to base64
const convertImageToBase64 = async (imageUrl) => {
    try {
        // If imageUrl is already a base64 string or buffer
        if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
            return imageUrl.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        }
        
        // If it's a buffer
        if (Buffer.isBuffer(imageUrl)) {
            return imageUrl.toString('base64');
        }

        // If it's a URL, fetch and convert
        if (typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('https'))) {
            const response = await fetch(imageUrl);
            const buffer = await response.arrayBuffer();
            return Buffer.from(buffer).toString('base64');
        }

        // If it's already base64 string
        if (typeof imageUrl === 'string') {
            return imageUrl;
        }

        throw new Error('Unsupported image format');
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
};

// Helper function to select wardrobe item with rotation logic
const selectWardrobeItem = (wardrobeItems, userId, occasion) => {
    if (wardrobeItems.length === 1) {
        return wardrobeItems[0];
    }

    // Simple rotation logic using timestamp-based selection
    const sessionKey = `${userId}_${occasion}`;
    const currentTime = Date.now();
    const index = Math.floor((currentTime / 1000) % wardrobeItems.length);
    
    return wardrobeItems[index];
};

export const generateImageForOccasion = async (req, res) => {
    try {
        const { occasion } = req.query;

        if (!occasion) {
            return res.status(400).json({ error: "Missing occasion" });
        }

        const results = [];
        let wardrobeImageGenerated = false;

        // Check for wardrobe items
        const wardrobeItems = await getGarmentsFromWardrobe(req, occasion);
        
        // If wardrobe items exist, generate styled image with one of them
        if (wardrobeItems.length > 0) {
            try {
                // Select a wardrobe item using rotation logic
                const selectedGarment = selectWardrobeItem(wardrobeItems, req.user._id, occasion);
                
                // Convert image to base64
                const base64Image = await convertImageToBase64(selectedGarment.imageUrl);

                const wardrobePrompt = `
ROLE: You are a professional fashion stylist creating a complete styled outfit using a specific wardrobe item.

OBJECTIVE: 
Create a complete, professionally styled outfit for a **${occasion}** occasion, featuring the clothing item shown in the provided image as the main piece.

✅ STYLING REQUIREMENTS:
- Use the provided clothing item as the CENTRAL piece of the outfit
- Complete the look with complementary pieces:
  - Add appropriate additional garments (if it's a top, add bottom; if it's a bottom, add top; if it's a dress, minimal layering only)
  - Include suitable footwear for ${occasion}
  - Add 2-3 accessories that enhance the overall look (bag, jewelry, belt, scarf, etc.)
- Ensure the entire outfit is perfect and appropriate for **${occasion}**

🎨 STYLING FOCUS:
- Make the provided garment look its absolute best
- Create a cohesive, well-coordinated look
- Use colors and styles that complement the existing item
- Consider the formality level required for ${occasion}
- Show how this personal wardrobe item can be styled beautifully

🖼️ VISUAL OUTPUT:
- Show a professional female model wearing the complete styled outfit
- Full-body shot with clean, neutral background
- High-quality fashion photography style
- Professional editorial look
- Showcase the provided wardrobe item prominently and attractively

✨ GOAL:
Transform the user's wardrobe item into a stunning, occasion-appropriate complete outfit styled on a professional model.
`;

                const wardrobeContents = [
                    { text: wardrobePrompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Image,
                        },
                    },
                ];

                const wardrobeResponse = await ai.models.generateContent({
                    model: "gemini-2.0-flash-preview-image-generation",
                    contents: wardrobeContents,
                    config: {
                        responseModalities: ["TEXT", "IMAGE"],
                    },
                });

                // Extract wardrobe styled image
                for (const part of wardrobeResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        results.push({
                            type: 'wardrobe',
                            image: part.inlineData.data,
                            itemName: selectedGarment.itemName,
                            itemId: selectedGarment.imageId
                        });
                        wardrobeImageGenerated = true;
                        console.log("Wardrobe styled image generated");
                        break;
                    }
                }

            } catch (wardrobeError) {
                console.warn("Wardrobe styling failed:", wardrobeError.message);
                // Continue with AI-only generation if wardrobe styling fails
            }
        }

        // Generate AI suggestions (2 if wardrobe item exists, 3 if not)
        const numberOfAIImages = wardrobeImageGenerated ? 2 : 3;
        
        const aiPrompt = `
ROLE: You are a professional fashion stylist creating complete, full-body styled outfits for a fashion editorial campaign.

OBJECTIVE:
Design ${numberOfAIImages} distinct cohesive outfits perfect for a **${occasion}** setting. Create complete looks styled on models for a fashion campaign.

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
- Ensure variety between the ${numberOfAIImages} different outfits

🖼️ VISUAL OUTPUT FORMAT:
- Each outfit styled on a photorealistic human **model**
- Professional editorial photography look – full-body model shots
- Clean and neutral background, natural light or soft studio lighting
- High-resolution fashion-forward appearance
- Show each complete outfit clearly and attractively

🚫 ABSOLUTE RULES:
- Generate exactly ${numberOfAIImages} distinct outfit looks
- No styling alternatives within each look
- No text overlays or descriptions on images
- Focus on showcasing realistic, wearable outfits

✨ GOAL:
Deliver ${numberOfAIImages} distinct and editorial-quality complete outfits suitable for the **${occasion}** setting, each styled professionally on a female model.
`;

        const aiResponse = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: aiPrompt,
            config: {
                responseModalities: ["TEXT", "IMAGE"],
                numberOfImages: numberOfAIImages,
            },
        });

        // Extract AI generated images
        let aiImageCount = 0;
        for (const part of aiResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                aiImageCount++;
                results.push({
                    type: 'ai_suggestion',
                    image: part.inlineData.data,
                    lookNumber: aiImageCount
                });
                console.log(`AI suggestion ${aiImageCount} generated`);
            }
        }

        return res.status(200).json({
            message: "Images created successfully",
            results,
            occasion: occasion,
            wardrobeItemUsed: wardrobeImageGenerated,
            totalImages: results.length,
            wardrobeItemsAvailable: wardrobeItems.length
        });

    } catch (err) {
        console.error("Generation error:", err.message);
        res.status(500).json({
            error: "Image generation failed",
            details: err.message
        });
    }
};