import { processWardrobeItemForOccasion } from "../services/aiImageFromWardrobeItem.js";
import { generateAIFashionSuggestions } from "../services/aiImageGeneration.js";

export const generateImageForOccasion = async (req, res) => {
    try {
        const { occasion } = req.query;

        if (!occasion) {
            return res.status(400).json({ error: "Missing occasion" });
        }

        const results = [];
        let wardrobeImageGenerated = false;
        let wardrobeItemsAvailable = 0;

        // Process wardrobe items using the service
        const wardrobeResult = await processWardrobeItemForOccasion(req, occasion);
        
        if (wardrobeResult.success) {
            results.push(wardrobeResult.data);
            wardrobeImageGenerated = true;
            wardrobeItemsAvailable = wardrobeResult.wardrobeItemsAvailable;
            console.log("Wardrobe styled image generated");
        } else {
            console.warn("Wardrobe styling failed:", wardrobeResult.error || wardrobeResult.message);
            wardrobeItemsAvailable = wardrobeResult.wardrobeItemsAvailable || 0;
            // Continue with AI-only generation if wardrobe styling fails
        }

        // Generate AI suggestions (2 if wardrobe item exists, 3 if not)
        const numberOfAIImages = wardrobeImageGenerated ? 2 : 3;
        
        // Generate AI fashion suggestions using the service
        const aiResult = await generateAIFashionSuggestions(occasion, numberOfAIImages);
        
        if (aiResult.success) {
            results.push(...aiResult.data);
            console.log(`Generated ${aiResult.totalGenerated} AI fashion suggestions`);
        } else {
            console.warn("AI image generation failed:", aiResult.error || aiResult.message);
        }

        return res.status(200).json({
            message: "Images created successfully",
            results,
            occasion: occasion,
            wardrobeItemUsed: wardrobeImageGenerated,
            totalImages: results.length,
            wardrobeItemsAvailable: wardrobeItemsAvailable,
            aiSuggestionsGenerated: aiResult.success ? aiResult.totalGenerated : 0
        });

    } catch (err) {
        console.error("Generation error:", err.message);
        res.status(500).json({
            error: "Image generation failed",
            details: err.message
        });
    }
};