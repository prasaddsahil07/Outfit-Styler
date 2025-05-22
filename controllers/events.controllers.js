import Event from '../models/events.models.js';
import { ai } from "../index.js";
import { Modality } from "@google/genai";
import path from "path";
import fs from "fs";

export const addEvent = async (req, res) => {
    const user = req.user;
    if (!user) {   
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = user._id;
    const { name, date, dayTime, occasion, isStyled, description, generatedImages } = req.body;

    try {
        const newEvent = await Event.create({
            userId,
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
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the user is authorized to update this event
        if (event.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to update this event' });
        }

        // Update the event with the new data
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
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the user is authorized to delete this event
        if (event.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to delete this event' });
        }

        // Delete the event        
        await Event.findByIdAndDelete(id);

        return res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
};

export const fetchAllEvents = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });   
        }
        const events = await Event.find({ userId: user._id });
        if (!events || events.length === 0) {
            return res.status(404).json({ message: 'No events found' });
        }

        return res.status(200).json({ message: 'Events fetched successfully', events });
    } catch (error) {
        console.error("Error fetching events:", error.message);
        return res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
};

export const getEventDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const eventDetails = await Event.findById(id);
        if (!eventDetails) {
            return res.status(404).json({ message: 'Event not found' });
        };

        // Check if the user is authorized to view this event
        if (eventDetails.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to view this event' });
        }

        return res.status(200).json({ message: 'Event details fetched successfully', event: eventDetails });
    } catch (error) {
        console.log("error : ", error.message);
        return res.status(500).json({ message: 'Error fetching event details', error: error.message });
    }
}

function buildOutfitPrompt(occasion, dayTime, description) {
    // Handle null/undefined description with more specific guidance
    const descriptionPart = description && description.trim()
        ? `Additional requirements: ${description.trim()}`
        : "Focus on timeless, versatile styling";

    // Enhanced prompt with detailed specifications for optimal results
    return `
        Think like a stylist and Create a photorealistic, high-quality outfit image featuring a complete, stylish ensemble with the following specifications:

        OCCASION & CONTEXT:
        - Primary occasion: ${occasion || "versatile everyday wear"}
        - Time of day: ${dayTime || "suitable for any time"}
        - ${descriptionPart}

        OUTFIT REQUIREMENTS:
        - Design a complete, coordinated outfit including: top, bottom, footwear, and appropriate accessories
        - Ensure all pieces complement each other in color, texture, and style
        - Make it season-appropriate and weather-suitable
        - Include tasteful accessories that enhance the overall look
        - Consider cultural appropriateness and modern fashion trends

        VISUAL SPECIFICATIONS:
        - Use soft, natural lighting that flatters the garments and creates gentle shadows
        - Set against a clean, neutral background (light gray, off-white, or subtle beige)
        - Ensure high resolution and crisp detail on fabric textures and colors
        - Display the outfit in a way that clearly shows all components
        - Maintain professional photography quality with balanced exposure

        STYLE GUIDELINES:
        - Prioritize timeless elegance combined with contemporary appeal
        - Ensure the outfit is practical and comfortable for the intended use
        - Balance colors harmoniously (consider complementary or monochromatic schemes)
        - Include styling details that elevate the overall appearance
        - Make it aspirational yet achievable for the average person

        FINAL REQUIREMENTS:
        - The result should be magazine-quality fashion photography
        - All garments should appear well-fitted and properly styled
        - The overall aesthetic should be polished, cohesive, and inspiring
        - Ensure the outfit would photograph well in real life and be genuinely wearable

        Generate the most stylish, appropriate, and visually appealing outfit possible for this specific context.
    `.replace(/\s+/g, ' ').trim();
}

async function generateOutfitAsPerRequirements(occasion, dayTime, description) {
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

        // fetch user body data here to give more personalized outfit

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
        return res.status(500).json({ message: 'Error styling event', error: error.message });
    }
};