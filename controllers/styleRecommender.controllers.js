import { uploadAndValidateWithCritique } from "../services/fashionValidator.js";
import { generateModelImage } from "../services/mannequinGenerator.js";
import { processWardrobeItemForOccasion } from "../services/aiImageFromWardrobeItem.js";
import { generateAIFashionSuggestions } from "../services/aiImageGeneration.js";
import { analyzeGeneratedAndBadImages } from "../services/imageAnalysisService.js";

// import { deleteFromCloudinary } from "../utils/cloudinary.js";

export const styleRecommenderController = async (req, res) => {
    try {
        const imageFiles = req.files;
        const occasion = req.body.occasion;
        const description = req.body.description || ""; // Optional description for wardrobe item

        if (!imageFiles?.length) {
            return res.status(400).json({ error: "No images provided" });
        }
        
        if (!occasion) {
            return res.status(400).json({ error: "Occasion is required" });
        }

        // Single merged function call for validation and critique
        const validationResult = await uploadAndValidateWithCritique(imageFiles, occasion, req);
        
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
        let wardrobeImageResponse = null;
        let aiGeneratedImageResponse = null;

        const results = [];

        // Always try to get wardrobe image first
        wardrobeImageResponse = await processWardrobeItemForOccasion(req, occasion, description);
        results.push(wardrobeImageResponse || null);

        // Determine how many AI images to generate based on wardrobe availability
        const aiImageCount = wardrobeImageResponse?.data ? 1 : 2;

        // Generate content for all cases
        modelImage = await generateModelImage(imageUrls, occasion, badItemImages, description, req);
        results.push(modelImage || null);
        aiGeneratedImageResponse = await generateAIFashionSuggestions(imageUrls, occasion, aiImageCount, description, req);
        results.push(aiGeneratedImageResponse?.imageB64 || null);

        // Analyze generated images and bad images with AI
        let imageAnalysis = null;
        try {
            imageAnalysis = await analyzeGeneratedAndBadImages(results, badItemImages, occasion);
        } catch (error) {
            console.error("Error analyzing images:", error);
            // Continue without image analysis if it fails
        }

        res.status(200).json({
            recommendations: critique,
            results,
            occasion,
            badItemImages, // This will be populated for mismatches
            isPerfectMatch, // Added this for frontend logic
            suitabilityDetails, // Added this for detailed feedback
            imageAnalysis // New field with AI analysis of generated and bad images
        });

        // await Promise.all(imageUrls.map(deleteFromCloudinary(url => url)));
    } catch (error) {
        console.error("Error in styleRecommenderController:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};