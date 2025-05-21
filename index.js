import express from "express";
import { GoogleGenAI, Modality, createUserContent } from "@google/genai";
import multer from "multer";
import dotenv from "dotenv";
import job from "./cron.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "./db/connectDB.js";
import { PythonShell } from "python-shell";


import eventRoute from "./routes/events.routes.js";


dotenv.config();

await connectDB();

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

job.start();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT;

app.use(express.json());

app.use("/static", express.static("static"));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static("public"));

app.use("/api/events", eventRoute);

// app.post('/api/process-garment', upload.single('image'), async (req, res) => {
//     const category = req.body.category;

//     if (!req.file || !category) {
//         return res.status(400).json({ error: "Image and category are required" });
//     }

//     const options = {
//         mode: 'json',
//         pythonPath: 'python',
//         pythonOptions: ['-u'],
//         scriptPath: __dirname
//     };

//     const pyshell = new PythonShell('clip_script.py', options);

//     pyshell.on('error', (err) => {
//         console.error('PythonShell Error:', err);
//         return res.status(500).json({ error: "Python script failed" });
//     });


//     const payload = {
//         image: req.file.buffer.toString('base64'),
//         category
//     };

//     let resultData = '';

//     pyshell.on('message', (message) => {
//         resultData += JSON.stringify(message);
//     });

//     pyshell.send(payload);

//     pyshell.end((err) => {
//         if (err) return res.status(500).json({ error: err.message });

//         try {
//             const parsed = JSON.parse(resultData);
//             if (parsed.error) {
//                 return res.status(500).json({ error: parsed.error });
//             }
//             res.json(parsed);
//         } catch (parseErr) {
//             res.status(500).json({ error: "Invalid response from Python script" });
//         }
//     });
// });

// IP-Adapter processing endpoint
// app.post('/api/style-outfits', upload.single('image'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: "Image is required" });
//     }

//     const options = {
//         mode: 'json',
//         pythonPath: 'python',
//         scriptPath: path.join(__dirname, 'python_scripts'),
//         pythonOptions: ['-u'],
//         args: []
//     };

//     try {
//         const results = await new Promise((resolve, reject) => {
//             const pyshell = new PythonShell('ip_adapter_processor.py', options);

//             let output = [];
//             pyshell.on('message', (message) => {
//                 output.push(message);
//             });

//             pyshell.send(req.file.buffer.toString('base64'));


//             pyshell.end((err) => {
//                 if (err) reject(err);
//                 resolve(output);
//             });
//         });

//         res.json({
//             original_image: `data:image/png;base64,${req.file.buffer.toString('base64')}`,
//             styled_outfits: results
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "landing.html"));
});

app.get("/api/closet/:weather", (req, res) => {
    const weather = req.params.weather.toLowerCase();
    const dirPath = path.join(__dirname, "public", "closet", `${weather}_collection`);

    try {
        const files = fs.readdirSync(dirPath);
        const imageFiles = files.filter(file => file.endsWith(".jpg"));
        res.json(imageFiles);
    } catch (err) {
        console.error("Directory read error:", err);
        res.status(500).json({ error: "Failed to read directory" });
    }
});

app.get("/get-my-wardrobe", async (req, res) => {
    try {
        const folders = ['topwear', 'bottomwear'];
        const baseDir = path.join(__dirname, 'uploads', 'wardrobe');
        const occasionsSet = new Set();
        const fabricSet = new Set();

        folders.forEach(folder => {
            const folderPath = path.join(baseDir, folder);
            const files = fs.readdirSync(folderPath);

            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const metadata = JSON.parse(fs.readFileSync(path.join(folderPath, file), 'utf-8'));

                    // console.log("Parsed metadata:", metadata);

                    const occasions = metadata.occasions;

                    if (Array.isArray(occasions)) {
                        occasions.forEach(o => occasionsSet.add(o.toLowerCase()));
                    } else if (typeof occasions === 'object' && occasions !== null) {
                        Object.values(occasions).forEach(arr => {
                            arr.forEach(o => occasionsSet.add(o.toLowerCase()));
                        });
                    }

                    const fabrics = metadata.fabrics;

                    if (Array.isArray(fabrics)) {
                        fabrics.forEach(o => fabricSet.add(o.toLowerCase()));
                    } else if (typeof fabrics === 'object' && fabrics !== null) {
                        Object.values(fabrics).forEach(arr => {
                            arr.forEach(o => fabricSet.add(o.toLowerCase()));
                        });
                    }

                }
            });

        });

        res.json({ occasions: Array.from(occasionsSet), fabrics: Array.from(fabricSet) });
    } catch (error) {
        // console.error("Error fetching wardrobe occasions:", error);
        res.status(500).json({ error: "Failed to fetch wardrobe data" });
    }
});

app.get("/filter-wardrobe", async (req, res) => {
    try {
        const { title, type } = req.query;

        if (!title || !type) {
            return res.status(400).json({ error: "Missing title or type in query" });
        }

        const collections = [];
        const folders = ['topwear', 'bottomwear'];
        const baseDir = path.join(__dirname, 'uploads', 'wardrobe');

        folders.forEach(folder => {
            const folderPath = path.join(baseDir, folder);
            const files = fs.readdirSync(folderPath);

            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const metadataPath = path.join(folderPath, file);
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

                    let matchFound = false;

                    if (title in metadata) {
                        const field = metadata[title];

                        // Handle array directly (like ["Work", "Party"])
                        if (Array.isArray(field)) {
                            matchFound = field.map(f => f.toLowerCase()).includes(type.toLowerCase());
                        }

                        // Handle nested object (like for "occasions": { topwear: [...], bottomwear: [...] })
                        else if (typeof field === 'object' && field !== null) {
                            Object.values(field).forEach(arr => {
                                if (Array.isArray(arr) && arr.map(f => f.toLowerCase()).includes(type.toLowerCase())) {
                                    matchFound = true;
                                }
                            });
                        }

                        // Handle simple string field (e.g., pattern: "Striped")
                        else if (typeof field === 'string') {
                            matchFound = field.toLowerCase() === type.toLowerCase();
                        }
                    }

                    if (matchFound) {
                        const imageFilename = file.replace('.json', '.jpg'); // assuming JPG images
                        const imagePath = `/uploads/wardrobe/${folder}/${imageFilename}`;
                        collections.push(imagePath);
                    }
                }
            });
        });

        res.json({ results: collections });
    } catch (error) {
        console.error("Error filtering wardrobe:", error);
        res.status(500).json({ error: "Failed to filter wardrobe" });
    }
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

Generate **three visually distinct complete outfits** in a flatlay/editorial style with modern Pinterest fashion aesthetic, using the uploaded ${clothingType} as the central piece for all three looks.

CRITICAL REQUIREMENTS:
1. The uploaded ${clothingType} item MUST appear EXACTLY as provided in all three images - do not alter its color, shape, pattern, style, size, or any visual characteristics.
2. Create three COMPLETELY DIFFERENT outfit combinations around this ${clothingType} for the "${occasion}" occasion.

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


        const contents = [
            { text: prompt },
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
        console.error("Generation error:", err.message);
        res.status(500).json({ error: "Image generation failed" });
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

app.post("/wardrobe/upload", upload.single('clothingImage'), async (req, res) => {
    let tempFilePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        // Create temp directory if not exists
        fs.mkdirSync("temp_uploads", { recursive: true });
        tempFilePath = path.join("temp_uploads", `${uuidv4()}.jpg`);
        await fs.promises.writeFile(tempFilePath, req.file.buffer);

        // Convert to base64 and extract metadata
        const base64Image = req.file.buffer.toString('base64');
        const metadata = await extractClothingMetadata(base64Image); // Pass only base64 string

        // Validate metadata
        if (!metadata || typeof metadata !== 'object') {
            throw new Error('Invalid metadata format received');
        }

        // Store organized image
        const savedLocations = await organizeClothingImage(tempFilePath, metadata);

        res.status(200).json({
            success: true,
            message: 'Clothing item processed successfully',
            metadata: metadata,
            locations: savedLocations
        });
    } catch (error) {
        console.error('Error processing clothing image:', error);
        res.status(500).json({
            success: false,
            error: 'Image processing failed',
            details: error.message
        });
    } finally {
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                await fs.promises.unlink(tempFilePath);
            } catch (cleanupError) {
                console.error('Failed to clean up temp file:', cleanupError);
            }
        }
    }
});

// Function to extract clothing metadata using Gemini API
async function extractClothingMetadata(base64Image, mimetype) {
    try {
        const prompt = `
        You are a professional fashion analyst. Analyze the uploaded clothing item image with attention to detail and return **only the most accurate metadata** in JSON format.

        Required JSON structure:
        {
            "category": "topwear" | "bottomwear" | "both",
            "itemCategories": ["specific", "types"],
            "fabrics": [] | { "topwear": [], "bottomwear": [] },
            "occasions": [] | { "topwear": [], "bottomwear": [] },
            "seasons": ["season1", "season2"],
            "colors": [] | { "topwear": [], "bottomwear": [] },
            "pattern": "pattern_name",
            "style": "style_description"
        }

        Rules:
        1. ALL fields must be populated - no null/undefined
        2. Return ONLY the JSON object - no markdown, no explanations
        3. For "both" category, split properties by garment part
        4. If uncertain, make educated guesses
        `;

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

        // Validate required fields
        const requiredFields = ['category', 'itemCategories', 'fabrics', 'occasions', 'seasons', 'colors', 'pattern', 'style'];
        for (const field of requiredFields) {
            if (!parsedMetadata[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        return parsedMetadata;

    } catch (error) {
        console.error('Metadata extraction error:', error);
        return getFallbackMetadata();
    }
}

// Default metadata for error cases
function getFallbackMetadata() {
    return {
        category: 'Uncategorized',
        itemCategories: ['Uncategorized'],
        fabrics: ['Unknown'],
        occasions: ['Casual'],
        seasons: ['All Seasons'],
        colors: ['Unknown'],
        pattern: 'Unknown',
        style: 'Unknown',
        dateAdded: new Date().toISOString()
    };
}

// Function to organize the clothing image into topwear and/or bottomwear folders
async function organizeClothingImage(sourcePath, metadata) {
    const savedLocations = [];

    try {
        // Create base directories if they don't exist
        const baseDir = path.join(__dirname, 'uploads', 'wardrobe');
        const topwearDir = path.join(baseDir, 'topwear');
        const bottomwearDir = path.join(baseDir, 'bottomwear');

        fs.mkdirSync(baseDir, { recursive: true });
        fs.mkdirSync(topwearDir, { recursive: true });
        fs.mkdirSync(bottomwearDir, { recursive: true });

        // Generate a unique filename for the image
        const uniqueFilename = `${Date.now()}-${path.basename(sourcePath)}`;

        // Create a JSON metadata file name
        const metadataFilename = uniqueFilename.replace(/\.[^/.]+$/, '.json');

        // Get the category from metadata
        const category = metadata.category.toLowerCase();

        const metadataContent = JSON.stringify(metadata, null, 2);

        // Based on the category, save the image to appropriate folders
        if (category === 'topwear' || category === 'both') {
            const topwearImagePath = path.join(topwearDir, uniqueFilename);
            fs.copyFileSync(sourcePath, topwearImagePath);

            const topwearMetadataPath = path.join(topwearDir, metadataFilename);
            fs.writeFileSync(topwearMetadataPath, metadataContent);

            savedLocations.push({
                category: 'topwear',
                imagePath: topwearImagePath,
                metadataPath: topwearMetadataPath
            });
        }

        if (category === 'bottomwear' || category === 'both') {
            // Save to bottomwear folder
            const bottomwearImagePath = path.join(bottomwearDir, uniqueFilename);
            fs.copyFileSync(sourcePath, bottomwearImagePath);

            // Copy metadata to bottomwear folder
            const bottomwearMetadataPath = path.join(bottomwearDir, metadataFilename);
            fs.writeFileSync(bottomwearMetadataPath, metadataContent);

            savedLocations.push({
                category: 'bottomwear',
                imagePath: bottomwearImagePath,
                metadataPath: bottomwearMetadataPath
            });
        }

        return savedLocations;

    } catch (error) {
        console.error('Error organizing clothing image:', error);
        throw new Error(`Failed to organize clothing image: ${error.message}`);
    }
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
