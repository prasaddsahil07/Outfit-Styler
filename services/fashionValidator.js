import OpenAI from "openai";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function uploadAndValidateWithCritique(files, occasion) {
    const imageUrls = [];

    // Upload all images first
    for (const file of files) {
        const result = await uploadOnCloudinary(file.path);
        imageUrls.push(result);
    }

    // Single API call for both validation and critique
    const validationResult = await validateAndCritiqueOutfit(imageUrls, occasion);
    
    // If any items are invalid fashion items, delete uploaded images and return error
    if (validationResult.hasInvalidFashionItems) {
        const deletionPromises = imageUrls.map(url => deleteFromCloudinary(url));
        await Promise.all(deletionPromises);
        
        return {
            error: validationResult.invalidItemsMessage,
            imageUrls,
            deleted: true,
        };
    }

    // Calculate bad item images if there's a mismatch
    const badItemImages = validationResult.badItemIndices?.length 
        ? validationResult.badItemIndices.map(idx => imageUrls[idx])
        : [];

    return {
        imageUrls,
        critique: validationResult.critique,
        isPerfectMatch: validationResult.isPerfectMatch,
        badItemImages, // Added this for easy access
        suitabilityDetails: validationResult.suitabilityDetails
    };
}

async function validateAndCritiqueOutfit(imageUrls, occasion) {
    const [top, bottom, accessory, footwear] = imageUrls;
    const labels = ['Topwear', 'Bottomwear', 'Accessory', 'Footwear'];

    const userContent = [
        {
            type: "input_text",
            text: `You are a professional fashion stylist and image validation assistant. The user has uploaded 1 to 4 items labeled as: Topwear, Bottomwear, Accessory, and Footwear. The occasion is: ${occasion}.

Your tasks:

**STEP 1: FASHION ITEM VALIDATION**
First, validate each uploaded image to ensure it contains a valid fashion item (clothing, footwear, or accessories). If ANY item is not a fashion item, respond with:
❌ INVALID FASHION ITEMS: [List the non-fashion items by their labels]

**STEP 2: OUTFIT CRITIQUE** (Only if all items are valid fashion items)
If all items are valid fashion items, provide:

1. A short fashion critique (within 50 words) about how well the items work together for the given occasion.
2. Conclude with either:
   ✅ Perfect Match
   ❌ Not Suitable

3. If ❌ Not Suitable, specify exactly which items are not suitable using this **exact JSON format**, including only the items provided:

{
  "Topwear": "suitable" | "not suitable",
  "Bottomwear": "suitable" | "not suitable", 
  "Footwear": "suitable" | "not suitable",
  "Accessory": "suitable" | "not suitable"
}

⚠️ Rules:
- ALWAYS do fashion validation first
- Only include keys in JSON for items that are provided
- The critique must come **before** the JSON
- Do not include any extra commentary outside the JSON
- The JSON must be valid and appear exactly as shown

Respond strictly in this structure.`
        },
        ...(top ? [{ type: "input_image", image_url: top }] : []),
        ...(bottom ? [{ type: "input_image", image_url: bottom }] : []),
        ...(accessory ? [{ type: "input_image", image_url: accessory }] : []),
        ...(footwear ? [{ type: "input_image", image_url: footwear }] : []),
    ];

    const messages = [{ role: "user", content: userContent }];

    const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: messages
    });

    const responseText = response.output_text;

    // Check if there are invalid fashion items
    if (responseText.includes("❌ INVALID FASHION ITEMS")) {
        const invalidItemsMatch = responseText.match(/❌ INVALID FASHION ITEMS:\s*\[([^\]]+)\]/i);
        const invalidItems = invalidItemsMatch ? invalidItemsMatch[1] : "Unknown items";
        
        return {
            hasInvalidFashionItems: true,
            invalidItemsMessage: `The following items are not valid fashion items: ${invalidItems}`,
        };
    }

    // Parse outfit critique
    const isPerfectMatch = responseText.includes("✅ Perfect Match");
    let badItemIndices = [];
    let suitabilityDetails = null;

    if (!isPerfectMatch) {
        // Try to extract JSON for unsuitable items
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                suitabilityDetails = JSON.parse(jsonMatch[0]);
                
                // Get indices of unsuitable items
                badItemIndices = labels
                    .map((label, index) => ({ label, index }))
                    .filter(({ label, index }) => 
                        imageUrls[index] && 
                        suitabilityDetails[label] === "not suitable"
                    )
                    .map(({ index }) => index);
            } catch (error) {
                console.error("Failed to parse suitability JSON:", error);
            }
        }
    }

    return {
        hasInvalidFashionItems: false,
        critique: responseText,
        isPerfectMatch,
        badItemIndices,
        suitabilityDetails
    };
}