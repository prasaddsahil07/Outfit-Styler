import express from "express";
import { GoogleGenAI, Modality } from "@google/genai";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

app.use(express.static("public"));
app.use(express.json());

app.post("/generate-image", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const base64Image = req.file.buffer.toString("base64");
        const styles = ["Office", "Party", "Vacation"];
        const results = [];

        for (const style of styles) {
            const prompt = `Create a high-quality, fashion-forward editorial image in the style of Pinterest photography. Stylize the uploaded outfit specifically for a ${style} occasion (Office, Party, or Vacation), showing it realistically worn by a consistent, model. The model should be the same across all three styles to maintain neutrality. Strictly retain the original outfit's structure, color, and format in every version. Ensure all outputs reflect a cohesive, realistic, and polished editorial aesthetic.`;

            const contents = [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: base64Image,
                    },
                },
            ];

            const outputDir = path.join("generated");
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-exp-image-generation",
                contents,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                },
            });

            const parts = response.candidates[0].content.parts;
            const imagePart = parts.find((p) => p.inlineData);

            if (imagePart) {
                const base64Data = imagePart.inlineData.data;
                const buffer = Buffer.from(base64Data, "base64");

                const fileName = `generated/${style.toLowerCase()}-${Date.now()}.png`;
                fs.writeFileSync(fileName, buffer);

                results.push({
                    style,
                    base64: base64Data, // for frontend preview
                    filePath: fileName  // optional: send back path
                });
            } else {
                results.push({ style, error: "No image returned" });
            }

        }

        res.json({ results });
    } catch (err) {
        console.error("Generation error:", err.message);
        res.status(500).json({ error: "Image generation failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
