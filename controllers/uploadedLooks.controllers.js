import { UploadedLooks } from "../models/uploadedLooksModel.js";
import { validateChatbotImage } from "../services/validateChatbotImage.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

export const addUploadedLook = async (req, res) => {
    const user = req.user;
    const imageFile = req.file;

    if (!user || !imageFile) {
        return res.status(400).json({ message: "User or image URL is missing" });
    }

    try {
        const imageUrl = await uploadOnCloudinary(imageFile.path);
        if (!imageUrl) {
            return res.status(500).json({ message: "Error uploading image to Cloudinary" });
        }
        const validationResult = await validateChatbotImage(imageUrl);
        const { containsFullBodyHuman, generatedTitle } = validationResult;

        if (!containsFullBodyHuman) {
            console.log("Image does not contain a full-body human, skipping upload");
            await deleteFromCloudinary(imageUrl); // clean up
            return res.status(204).end();
        }

        const newLook = new UploadedLooks({
            userId: user._id,
            imageUrl,
            title: generatedTitle || "Your Uploaded Look" // fallback title
        });

        await newLook.save();
        return res.status(201).json({ message: "Look uploaded successfully", data: newLook });
    } catch (error) {
        console.error("Error adding uploaded look:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// get all uploaded looks
export const getUploadedLooks = async (req, res) => {
    try {
        const userId = req.user._id;

        const looks = await UploadedLooks.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({ looks });
    } catch (error) {
        console.error('Error fetching looks:', error);
        res.status(500).json({ message: 'Failed to fetch looks', error: error.message });
    }
};

// delete an uploaded look
export const deleteUploadedLook = async (req, res) => {
    try {
        const userId = req.user._id;
        const { lookId } = req.params;

        const look = await UploadedLooks.findOne({ _id: lookId, userId });

        if (!look) {
            return res.status(404).json({ message: 'Look not found or not authorized to delete.' });
        }

        const imageUrl = look.imageUrl;

        const deleted = await UploadedLooks.findOneAndDelete({ _id: lookId, userId });

        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        if (!deleted) {
            return res.status(404).json({ message: 'Look not found or not authorized to delete.' });
        }

        res.status(200).json({ message: 'Look deleted successfully' });
    } catch (error) {
        console.error('Error deleting look:', error);
        res.status(500).json({ message: 'Failed to delete look', error: error.message });
    }
};