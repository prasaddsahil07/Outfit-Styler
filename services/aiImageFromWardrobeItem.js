import { ai } from "../index.js";
import { DigitalWardrobe } from "../models/digitalWardrobe.models.js";

export const getGarmentsFromWardrobe = async (req, occasion) => {
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

export const convertImageToBase64 = async (imageUrl) => {
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

export const selectWardrobeItem = (wardrobeItems, userId, occasion) => {
    if (wardrobeItems.length === 1) {
        return wardrobeItems[0];
    }

    // Simple rotation logic using timestamp-based selection
    const sessionKey = `${userId}_${occasion}`;
    const currentTime = Date.now();
    const index = Math.floor((currentTime / 1000) % wardrobeItems.length);
    
    return wardrobeItems[index];
};

export const generateWardrobeStyledImage = async (selectedGarment, occasion, description = '') => {
    try {
        // Convert image to base64
        const base64Image = await convertImageToBase64(selectedGarment.imageUrl);

        // Build description section for the prompt
        const descriptionSection = description && description.trim() 
            ? `\n📝 ADDITIONAL STYLING REQUIREMENTS:\n- ${description.trim()}\n- Incorporate these specific preferences while maintaining the overall styling guidelines\n`
            : '';

        const wardrobePrompt = `
ROLE: You are a professional fashion stylist creating a complete styled outfit using a specific wardrobe item.

OBJECTIVE: 
Create a complete, professionally styled outfit for a **${occasion}** occasion, featuring the clothing item shown in the provided image as the main piece.
${descriptionSection}
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

        // Extract and return the generated image
        for (const part of wardrobeResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                return {
                    success: true,
                    data: {
                        type: 'wardrobe',
                        imageB64: part.inlineData.data,
                        itemName: selectedGarment.itemName,
                        itemId: selectedGarment.imageId,
                        description: description || null
                    }
                };
            }
        }

        throw new Error('No image generated in AI response');

    } catch (error) {
        console.error('Error generating wardrobe styled image:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const processWardrobeItemForOccasion = async (req, occasion, description = '') => {
    try {
        // Get wardrobe items for the occasion
        const wardrobeItems = await getGarmentsFromWardrobe(req, occasion);
        
        if (wardrobeItems.length === 0) {
            return {
                success: false,
                message: 'No wardrobe items found for this occasion',
                wardrobeItemsAvailable: 0
            };
        }

        // Select a wardrobe item using rotation logic
        const selectedGarment = selectWardrobeItem(wardrobeItems, req.user._id, occasion);
        
        // Generate styled image with optional description
        const result = await generateWardrobeStyledImage(selectedGarment, occasion, description);
        
        if (result.success) {
            return {
                success: true,
                data: result.data,
                wardrobeItemsAvailable: wardrobeItems.length,
                message: 'Wardrobe styled image generated successfully'
            };
        } else {
            return {
                success: false,
                error: result.error,
                wardrobeItemsAvailable: wardrobeItems.length,
                message: 'Failed to generate wardrobe styled image'
            };
        }

    } catch (error) {
        console.error('Error processing wardrobe item:', error);
        return {
            success: false,
            error: error.message,
            message: 'Error processing wardrobe item for occasion'
        };
    }
};