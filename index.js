import express from "express";
import { GoogleGenAI, Modality } from "@google/genai";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import job from "./cron.js";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

job.start();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT;

app.use(express.static("public"));
app.use(express.json());

app.post("/generate-image", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const base64Image = req.file.buffer.toString("base64");
        const styles = ["Office", "Party", "Vacation"];
        const results = [];

        for (const style of styles) {
            const prompt = `Generate a high-quality editorial image in Pinterest fashion style. Take the uploaded outfit and apply realistic styling suitable for a ${style} occasion (Office, Party, or Vacation), BUT DO NOT alter the outfit’s shape, structure, length, width, height, fabric, color, or design in any way. 
            The exact outfit must be preserved — no shortening, lengthening, or color variation is allowed. The model wearing the outfit should remain consistent across all outputs, and the garment must appear exactly the same in all styles, only changing the background and accessories minimally to reflect the occasion. Maintain full photorealism and editorial polish.`;


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
