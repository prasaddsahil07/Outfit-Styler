import Event from '../models/events.models.js';
// import { GoogleGenAI, Modality } from "@google/genai";
// import * as fs from "node:fs";
import { ai } from "../index.js";
import { Modality } from "@google/genai";
import path from "path";
import fs from "fs";

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const addEvent = async (req, res) => {
    const { name, date, dayTime, occasion, isStyled, description, generatedImages } = req.body;

    try {
        const newEvent = await Event.create({
            name,
            date,
            dayTime,
            occasion,
            isStyled,
            description,
            generatedImages
        });

        res.status(201).json({ message: 'Event created successfully', event: newEvent });
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
};

export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { name, date, dayTime, occasion, isStyled, description, generatedImages } = req.body;

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { name, date, dayTime, occasion, isStyled, description, generatedImages },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
    } catch (error) {
        res.status(500).json({ message: 'Error updating event', error: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEvent = await Event.findByIdAndDelete(id);

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
};

// getAllEvents is due because of User model

export const getEventDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const eventDetails = await Event.findById(id);;
        if (!eventDetails) {
            return res.status(404).json({ message: 'Event not found' });
        };
        res.status(200).json({ message: 'Event details fetched successfully', event: eventDetails });
    } catch (error) {
        console.log("error : ", error.message);
        res.status(500).json({ message: 'Error fetching event details', error: error.message });
    }
}

function buildOutfitPrompt(occasion, dayTime, description) {
    // Handle null/undefined description
    const descriptionPart = description
        ? `Specific requirements: ${description}`
        : "No specific requirements provided";

    // Fine-tuned prompt structure
    return `
        Generate a complete outfit image suggestion with these characteristics:
        1. Occasion: ${occasion || "general"}
        2. Time of day: ${dayTime || "any time"}
        3. ${descriptionPart}
        
        Please include these details in your response:
        - Outfit composition (top, bottom, footwear, accessories)
        - Style notes (e.g., "business casual", "streetwear")
        - Weather appropriateness
        - Any cultural considerations for the occasion
        
        Make the suggestion practical, fashionable, and suitable for the given context.
    `.replace(/\s+/g, ' ').trim(); // Remove extra whitespace
}


export async function generateOutfitAsPerRequirements(occasion, dayTime, description) {
    try {
        const prompt = buildOutfitPrompt(occasion, dayTime, description);

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: prompt,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });

        const result = {
            textDescription: "",
            imageUrl: "",
            status: "success",
        };

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                result.textDescription = part.text;
            } else if (part.inlineData) {
                const imageDataB64 = part.inlineData.data;
                const buffer = Buffer.from(imageDataB64, "base64");

                // Ensure folder exists
                const imagesDir = path.join("static", "images");
                fs.mkdirSync(imagesDir, { recursive: true });

                const filename = `outfit_${Date.now()}.png`;
                const filepath = path.join(imagesDir, filename);
                fs.writeFileSync(filepath, buffer);

                // Set accessible image URL
                result.imageUrl = `/static/images/${filename}`;
            }
        }

        return {
            success: true,
            data: result,
        };

    } catch (error) {
        console.error("Generation Error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}


export const styleForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.isStyled || !event.generatedImages || event.generatedImages.length === 0) {
            const genResult = await generateOutfitAsPerRequirements(
                event.occasion,
                event.dayTime,
                event.description
            );

            // console.log("GEN RESULT:", genResult);

            if (!genResult.success || !genResult.data?.imageUrl) {
                return res.status(500).json({ message: 'Error generating outfit' });
            }

            // Save the image as base64 or link to image hosting
            event.isStyled = true;
            event.generatedImages = [genResult.data.imageUrl];
            await event.save();

            return res.status(200).json({
                message: 'Event styled successfully',
                description: genResult.data.textDescription,
                images: event.generatedImages,
            });
        }

        return res.status(200).json({
            message: 'Event already styled',
            images: event.generatedImages,
        });
    } catch (error) {
        console.error("Error styling event:", error.message);
        res.status(500).json({ message: 'Error styling event', error: error.message });
    }
};

