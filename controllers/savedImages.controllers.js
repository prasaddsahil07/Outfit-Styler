import { SavedImage } from "../models/savedImages.models.js";
import { User } from "../models/users.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

// add image to saved collection
export const addImageToSavedCollection = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is available in req.user
        const { tags, occasion } = req.body;

        const imageLocalPath = req.files?.image[0].path;

        // Validate required fields
        if (!imageLocalPath || !tags || !occasion) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        // Upload image to Cloudinary
        const imageUrl = await uploadOnCloudinary(imageLocalPath);
        if (!imageUrl) {
            return res.status(500).json({ msg: "Failed to upload image" });
        }

        // Create a new saved image document
        const savedImage = await SavedImage.create({
            imageUrl,
            tags: Array.isArray(tags) ? tags : [tags], // Ensure tags is an array
            occasion
        });

        // Add the saved image to the user's savedImages array
        await User.findByIdAndUpdate(
            userId,
            { $push: { savedImages: savedImage._id } }, // Push the saved image ID to the user's savedImages array
            { new: true }
        );

        res.status(201).json({
            msg: "Image added to saved collection successfully",
            data: savedImage
        });
    } catch (error) {
        return res.status(500).json({ msg: "Something went wrong while adding image to saved collection" });
    }
}

export const getSavedImages = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is available in req.user
        const savedImages = await SavedImage.find({ _id: { $in: req.user.savedImages } });
        if (!savedImages || savedImages.length === 0) {
            return res.status(404).json({ msg: "No saved images found" });
        }
        res.status(200).json({
            msg: "Saved images fetched successfully",
            data: savedImages
        });
    } catch (error) {
        return res.status(500).json({ msg: "Something went wrong while fetching saved images" });
    }
}

export const removeFromSavedImages = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is available in req.user
        const { imageId } = req.params; // Get image ID from request parameters
        if (!imageId) {
            return res.status(400).json({ msg: "Image ID is required" });
        }
        // Find the saved image by ID
        const savedImage = await SavedImage.findById(imageId);
        if (!savedImage) {
            return res.status(404).json({ msg: "Saved image not found" });
        }
        // Remove the saved image from the user's savedImages array
        await User.findByIdAndUpdate(
            userId,
            { $pull: { savedImages: imageId } }, // Pull the saved image ID from the user's savedImages array
            { new: true }
        );
        // Optionally, delete the saved image from the database
        await SavedImage.findByIdAndDelete(imageId);
        // Optionally, delete the image from Cloudinary
        await deleteFromCloudinary(savedImage.imageUrl);
        res.status(200).json({
            msg: "Image removed from saved collection successfully",
            data: savedImage
        });
    } catch (error) {
        return res.status(500).json({ msg: "Something went wrong while removing image from saved collection" });
    }
}