import { Event } from "../models/events.models.js";

export const addStyledImageToEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId, dayEventId } = req.params;

    const styledImageData = req.body.styledImageUrls; // can be string or array

    if (
      !styledImageData ||
      (Array.isArray(styledImageData) && styledImageData.length === 0)
    ) {
      return res.status(400).json({ error: "Styled image(s) required" });
    }

    const styledImageUrls = Array.isArray(styledImageData)
      ? styledImageData
      : [styledImageData];

    let event;

    if (dayEventId) {
      // Multi-day event: update specific day
      event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          userId,
          "daySpecificData._id": dayEventId,
        },
        {
          $set: {
            "daySpecificData.$.daySpecificImage": styledImageUrls[0], // assuming only 1 image for now
            isStyled: true,
          },
        },
        { new: true, runValidators: true }
      );
    } else {
      // Single-day event
      event = await Event.findOneAndUpdate(
        { _id: eventId, userId },
        {
          $set: { isStyled: true },
          $push: { generatedImages: { $each: styledImageUrls } },
        },
        { new: true, runValidators: true }
      );
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    res.status(200).json({
      message: "Styled image(s) added to event successfully",
      event,
    });
  } catch (error) {
    console.error("Error adding styledImage to event: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};