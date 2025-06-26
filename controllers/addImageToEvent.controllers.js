import { Event } from "../models/events.models.js";
import { getImageUrlFromBase64 } from "../services/base64ToImageUrl.js";

export const addStyledImageToEvent = async (req, res) => {
    try {
        const userId = req.user._id;
        const { eventId } = req.params;

        const styledImageB64 = req.body.styledImageB64;
        if (!styledImageB64) {
            return res.status(400).json({ error: "Styled image data is required" });
        }

        const styledImageUrl = await getImageUrlFromBase64(styledImageB64, userId);

        const event = await Event.findOneAndUpdate(
            { _id: eventId, userId },
            {
                $set: { isStyled: true },
                $push: { generatedImages: styledImageUrl }
            },
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json({ error: "Event not found or unauthorized" });
        }

        res.status(200).json({
            message: "Styled image added to event successfully",
            event,
        });
    } catch (error) {
        console.error("Error adding styledImage to event: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
