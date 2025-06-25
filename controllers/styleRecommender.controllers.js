import { uploadAndValidateImages } from "../services/fashionValidator.js";
import { getOutfitCritique } from "../services/outfitCritique.js";
import { generateModelImage } from "../services/mannequinGenerator.js";
import { processWardrobeItemForOccasion } from "../services/aiImageFromWardrobeItem.js";
import { generateAIFashionSuggestions } from "../services/aiImageGeneration.js";

import { deleteFromCloudinary } from "../utils/cloudinary.js";

export const styleRecommenderController = async (req, res) => {
    try {
        const imageFiles = req.files;
        const occasion = req.body.occasion;

        if (!imageFiles?.length) {
            return res.status(400).json({ error: "No images provided" });
        }

        if (!occasion) {
            return res.status(400).json({ error: "Occasion is required" });
        }

        const { imageUrls, error } = await uploadAndValidateImages(imageFiles);
        if (error) {
            return res.status(400).json({ error });
        }


        const { critique, isPerfectMatch, badItemIndices } = await getOutfitCritique(imageUrls, occasion);

        let modelImage = null;
        let niceMessage = null;
        let badItemImages = [];
        let wardrobeImageResponse = null;
        let aiGeneratedImageResponse = null;

        if (isPerfectMatch) {
            modelImage = await generateModelImage(imageUrls, occasion);
            wardrobeImageResponse = await processWardrobeItemForOccasion(req, occasion);
            aiGeneratedImageResponse = await generateAIFashionSuggestions(occasion, 1);
            niceMessage = "Here’s your perfectly styled outfit visualized! 💃✨";
        } else if (badItemIndices?.length) {
            badItemImages = badItemIndices.map(idx => imageUrls[idx]);
        }

        res.status(200).json({
            recommendations: critique,
            modelImage,
            wardrobeImage: wardrobeImageResponse.data.imageB64,
            aiGeneratedImage: aiGeneratedImageResponse.data.imageB64,
            message: niceMessage,
            badItemImages
        });
        // await Promise.all(publicIds.map(deleteFromCloudinary));
    } catch (error) {
        console.error("Error in styleRecommenderController:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
