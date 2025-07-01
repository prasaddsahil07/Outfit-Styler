import express from "express";
import { GoogleGenAI, Modality, createUserContent } from "@google/genai";
import multer from "multer";
import dotenv from "dotenv";
import job from "./cron.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { connectDB } from "./db/connectDB.js";
import OpenAI from "openai";
import cors from "cors";
// import { PythonShell } from "python-shell";
// import { updateCache } from "./controllers/homeScreen.controllers.js";



import eventRoute from "./routes/events.routes.js";
import userRoute from "./routes/users.routes.js";
// import userBodyInfoRoute from "./routes/userBodyInfo.routes.js";
import wardrobeRoute from "./routes/digitalWardrobe.routes.js";
import imageRoute from "./routes/image.js";
import savedFavouritesRoute from "./routes/savedFavourites.routes.js";
// import fashionNewsRoute from "./routes/zuriMagazine.routes.js";
// import dailyPostRoute from "./routes/dailyPost.routes.js";
// import instaPostRoute from "./routes/instaPosts.routes.js";
import stylingRoute from "./routes/generateImages.routes.js";
import styleRecommenderRoute from "./routes/styleRecommender.routes.js";
// import newsRoute from "./routes/news.js";

dotenv.config();

await connectDB();

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

job.start();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT;

app.use(express.json());

app.use("/static", express.static("static"));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create /tmp dir if it doesn't exist
const tmpPath = path.join(__dirname, "tmp");
if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath);
}

app.use("/upload", imageRoute);

app.use(express.static("public"));

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));


// all routes
app.use("/api/users", userRoute);
app.use("/api/events", eventRoute);
// app.use("/api/userBodyInfo", userBodyInfoRoute);
app.use("/api/wardrobe", wardrobeRoute);
app.use("/api/savedFavourites", savedFavouritesRoute);
// app.use("/api/fashionNews", fashionNewsRoute);
// app.use("/api/dailyPost", dailyPostRoute);
// app.use("/api/instaPosts", instaPostRoute);
app.use("/api/styleRecommender", styleRecommenderRoute);
app.use("/api/styling", stylingRoute);
// app.use("/api/fashion", newsRoute);


// Initial fetch and 12-hour interval update
// updateCache();
// setInterval(updateCache,  60 * 60 * 1000); // Every 12 hours

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "landing.html"));
});

app.post("/generate-image", upload.single("image"), async (req, res) => {
    try {
        const clothingType = req.body.bodyPart;
        const occasion = req.body.occasion;

        if (!req.file || !clothingType || !occasion) {
            return res.status(400).json({ error: "Missing image or clothing type/occasion" });
        }

        const base64Image = req.file.buffer.toString("base64");

        const prompt = `
Approach this like a professional fashion stylist creating 3 distinct editorials based on one key garment.

Generate **three visually distinct complete outfits** in a flatlay/editorial style with modern Pinterest fashion aesthetic, using the uploaded topwear as the central piece for all three looks.

CRITICAL REQUIREMENTS:
1. The uploaded topwear item MUST appear EXACTLY as provided in all three images - do not alter its color, shape, pattern, style, size, or any visual characteristics.
2. Create three COMPLETELY DIFFERENT outfit combinations around this topwear for the "date-night" occasion.

For each complete outfit:
- If user uploaded topwear: Add different bottoms, shoes, and accessories for each look
- If user uploaded bottomwear: Add different tops, shoes, and accessories for each look
- Include appropriate accessories that complement each unique styling direction (jewelry, bags, shoes, belts, etc.)

Visual presentation requirements:
- Flatlay/editorial composition with items arranged professionally
- Clean, neutral background with soft natural lighting
- No human figures or mannequins
- Photorealistic, high-quality imagery with professional styling
- Maintain consistent size/scale of the uploaded item across all three outfits

The goal is to showcase styling versatility by creating three distinct aesthetic directions using the EXACT SAME uploaded garment. Think of these as three separate magazine editorials featuring the same piece styled in completely different ways.
`;


        const prompt1 = `Take the uploaded image and mask all the items present (e.g., clothes, accessories, shoes, bags). Create a new image where these items are cleanly extracted and arranged together in a flatlay style — like how items are laid out on Pinterest fashion boards.

The background should be neutral (light gray or beige), and the lighting must be soft and diffused, avoiding harsh shadows. The resulting image should look professionally styled, with a minimalist flatlay aesthetic.

Ensure that the items are clearly visible, properly aligned, and spaced aesthetically. Do not include the original photo's background or body — only the segmented items should be retained.`

        const contents = [
            { text: prompt1 },
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: base64Image,
                },
            },
        ];

        const results = [];

        // Generate 3 variations
        for (let i = 1; i <= 3; i++) {
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                },
            });

            // console.log(response.candidates[0].content.parts);

            const parts = response.candidates[0].content.parts;
            // const textPart = parts.find((p) => p.text);

            const imagePart = parts.find((p) => p.inlineData);

            // console.log(textPart);

            if (imagePart) {
                results.push({
                    style: `${occasion}`,
                    base64: imagePart.inlineData.data,
                });
            } else {
                results.push({
                    style: `${occasion}`,
                    error: "No image returned from Gemini",
                });
            }
        }

        res.json({ results });
    } catch (err) {
        console.error("Generation error:", err.message);
        res.status(500).json({ error: "Image generation failed" });
    }
});

app.post("/generateImageForOccasion", async (req, res) => {
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
});

app.post("/generate-image-from-wardrobe", async (req, res) => {
    const { bodyPart, occasion } = req.body;

    if (!bodyPart || !occasion) {
        return res.status(400).json({ error: "Missing clothing type or occasion" });
    }

    const wardrobeDir = path.join(__dirname, "wardrobe");

    try {
        // Read and take first 5 images
        const files = fs.readdirSync(wardrobeDir)
            .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
            .slice(0, 10);

        // Convert images to base64 (without data URI prefix)
        const base64Images = files.map(file => {
            const filePath = path.join(wardrobeDir, file);
            const imageBuffer = fs.readFileSync(filePath);
            return imageBuffer.toString("base64");
        });

        // Prompt for the model — no need to embed base64 images in prompt string
        const prompt = `Think and reason like a professional fashion stylist tasked with creating three visually appealing and occasion-appropriate outfits using the actual clothes from a client's closet.
        You are given a collection of 10 outfit images from a user's digital wardrobe. Each image is either a top-wear or bottom-wear item. These wardrobe items must be used *as-is* — do not modify their shape, size, color, texture, or design in any way.

        Your task is to carefully analyze **all the wardrobe images** and generate **three distinct, different styles and complete fashion outfits** styled for the occasion: "${occasion}". Each outfit should focus on showcasing clothing items related to the user's selected focus: "${bodyPart}" (either top-wear or bottom-wear).

        For each of the 3 styles:
        - Use **only the items present in the wardrobe**; do not invent or hallucinate garments.
        - Select the most suitable yet different combinations based on the occasion and body part.
        - Maintain the original look of wardrobe items without any alteration.
        - Add realistic complementary elements (e.g., shoes, bags, subtle accessories) to complete the outfit, only if needed.
        - Avoid human figures or mannequins completely.
        - Present the outfits in a neutral, editorial-style layout — flatlay, still-life, or styled product shot.
        - Ensure photorealistic quality and distinct styling direction for each look.
        - Each image must feel fashion-forward, polished, and Pinterest-worthy.`;


        // Format content for Gemini API
        const contents = createUserContent([
            { text: prompt },
            ...base64Images.map(base64 => ({
                inlineData: {
                    mimeType: "image/jpeg", // or dynamically detect mimeType if needed
                    data: base64,
                },
            })),
        ]);

        const results = [];

        for (let i = 1; i <= 3; i++) {
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                },
            });
            // console.log(response.text);
            // console.log(response.candidates[0].content);
            const parts = response.candidates[0].content.parts;
            const imagePart = parts.find(p => p.inlineData);

            if (imagePart) {
                results.push({
                    style: `${occasion} #${i}`,
                    base64: imagePart.inlineData.data,
                });
            } else {
                results.push({
                    style: `${occasion} #${i}`,
                    error: "No image returned from Gemini",
                });
            }
        }

        res.json({ results });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to process wardrobe images" });
    }
});

// Function to extract clothing metadata using Gemini API
export async function extractClothingMetadata(base64Image, mimetype) {
    try {
        const prompt = `
You are a fashion analysis AI. Given a clothing image (either a single dress or a topwear + bottomwear combination), return a JSON array of 1–2 objects with the following strict structure:

[
  {
    "itemName": "e.g. Floral Crop Top",
    "category": one of the following: "Tops", "Bottoms", "Dresses", "Ethnic", "Swimwear", "Footwear", "Accessories", "co-ord set",
    "color": {
      "name": readable color name (e.g. "Beige", "Navy Blue"),
      "hex": corresponding hex code (e.g. "#F5F5DC", "#000080")
    },
    "fabric": one open-ended tag like "Silk" — must be relevant to usage,
    "occasion": up to 3 open-ended tags like ["Party", "Work", "Travel"] — must be lowercase and relevant to usage,
    "season": pick 1–2 from: "Summer", "Winter", "Monsoon", "Autumn", "Spring", "All Season"
  }
]

Rules:
- Return exactly 1 or 2 garments depending on the image.
- Only return valid enums for category, fabric, and season.
- Do not invent or guess values outside these enums.
- color must include both a human-readable name and a hex code.
- Never return null, undefined, empty strings, or invalid fields.
- Do not include any explanation, comment, or markdown — just the pure JSON array.
        `.trim();

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimetype || "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        });

        const textResponse = response.candidates[0]?.content?.parts?.[0]?.text || '';
        const jsonString = textResponse
            .replace(/^```json|```$/g, '')
            .replace(/^```|```$/g, '')
            .trim();

        if (!jsonString) throw new Error('Empty response from Gemini');

        const parsedMetadata = JSON.parse(jsonString);
        return parsedMetadata;

    } catch (error) {
        console.error('Metadata extraction error:', error);
        throw new Error('Strict metadata extraction failed. Make sure the image is valid and well-lit.');
    }
};

// Function to exctract complementary item metadata using Gemini API
export async function extractComplementaryClothMetaData(base64Image, occasion, preservedType, mimetype) {
    try {
        const prompt = `You are a fashion stylist. A user uploaded a ${preservedType} outfit for a ${occasion} occasion. Suggest a complementary clothing item (not repeating the preserved type). 
        Return a JSON with fields: category, color, fabric, pattern, season, ai_tags.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimetype || "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                response_mime_type: "application/json"

            }
        });

        // Extract and clean JSON response
        const textResponse = response.candidates[0]?.content?.parts?.[0]?.text || '';
        const jsonString = textResponse
            .replace(/^```json|```$/g, '')
            .replace(/^```|```$/g, '')
            .trim();

        if (!jsonString) throw new Error('Empty response from Gemini');

        const parsedMetadata = JSON.parse(jsonString);

        return parsedMetadata;
    } catch (error) {
        console.error("Error extracting complementary clothing metadata:", error);
        throw error;
    }
};

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});