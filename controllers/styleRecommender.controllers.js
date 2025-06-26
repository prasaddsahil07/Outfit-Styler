import { uploadAndValidateWithCritique } from "../services/fashionValidator.js";
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

        // Single merged function call for validation and critique
        const validationResult = await uploadAndValidateWithCritique(imageFiles, occasion);
        
        if (validationResult.error) {
            return res.status(400).json({ error: validationResult.error });
        }

        const { 
            imageUrls, 
            critique, 
            isPerfectMatch, 
            badItemImages,
            suitabilityDetails 
        } = validationResult;

        let modelImage = null;
        let niceMessage = null;
        let wardrobeImageResponse = null;
        let aiGeneratedImageResponse = null;

        if (isPerfectMatch) {
            // Generate additional content for perfect matches
            modelImage = await generateModelImage(imageUrls, occasion, badItemImages);
            wardrobeImageResponse = await processWardrobeItemForOccasion(req, occasion);
            aiGeneratedImageResponse = await generateAIFashionSuggestions(occasion, 1);
            niceMessage = "Here's your perfectly styled outfit visualized! 💃✨";
        } else {
            // Generate model image even for mismatches, but exclude bad items
            modelImage = await generateModelImage(imageUrls, occasion, badItemImages);
            wardrobeImageResponse = await processWardrobeItemForOccasion(req, occasion);
            aiGeneratedImageResponse = await generateAIFashionSuggestions(occasion, 1);
            niceMessage = "Here's your outfit visualized with AI suggestions! 🛍️✨";
        }

        res.status(200).json({
            recommendations: critique,
            modelImage,
            wardrobeImage: wardrobeImageResponse?.data?.imageB64 || null,
            aiGeneratedImage: aiGeneratedImageResponse?.data?.imageB64 || null,
            message: niceMessage,
            badItemImages, // This will be populated for mismatches
            isPerfectMatch, // Added this for frontend logic
            suitabilityDetails, // Added this for detailed feedback
        });

        await Promise.all(imageUrls.map(deleteFromCloudinary(url => url)));
    } catch (error) {
        console.error("Error in styleRecommenderController:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};