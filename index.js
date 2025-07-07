import express from "express";
import { GoogleGenAI, Modality, createUserContent } from "@google/genai";
import multer from "multer";
import dotenv from "dotenv";
import job from "./cron.js";
import path from "path";

import { connectDB } from "./db/connectDB.js";
import OpenAI from "openai";
import cors from "cors";

import eventRoute from "./routes/events.routes.js";
import userRoute from "./routes/users.routes.js";
// import userBodyInfoRoute from "./routes/userBodyInfo.routes.js";
import wardrobeRoute from "./routes/digitalWardrobe.routes.js";
import imageRoute from "./routes/image.js";
import savedFavouritesRoute from "./routes/savedFavourites.routes.js";
import uploadedLooksRoute from "./routes/uploadedLooks.routes.js";
import magazineRoute from "./routes/zuriMagazine.routes.js";
// import dailyPostRoute from "./routes/dailyPost.routes.js";
// import instaPostRoute from "./routes/instaPosts.routes.js";
import stylingRoute from "./routes/generateImages.routes.js";
import styleRecommenderRoute from "./routes/styleRecommender.routes.js";
import addImageToEventRoute from "./routes/addImageToEvent.routes.js";

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
app.use("/api/uploadedLooks", uploadedLooksRoute);
app.use("/api/magazine", magazineRoute);
// app.use("/api/instaPosts", instaPostRoute);
app.use("/api/styleRecommender", styleRecommenderRoute);
app.use("/api/styling", stylingRoute);
app.use("/api/imageToEvent", addImageToEventRoute);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "landing.html"));
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