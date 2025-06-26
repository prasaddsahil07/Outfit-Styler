import { SavedFavourites } from "../models/savedFavourites.models.js";
import { getImageUrlFromBase64 } from "../services/base64ToImageUrl.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";


// add image to saved favourites
export const addToSavedFavourites = async (req, res) => {    
    try {
        const userId = req.user._id;
        if(!userId) {
            return res.status(400).json({message: "User unauthorized to access this feature"});
        }

        const { imageB64, tag, occasion, description } = req.body;
        if (!imageB64 || !tag || !occasion || !description) {
            return res.status(400).json({message: "All fields are required"});
        }

        // Convert base64 to temporary file
        const imageUrl = await getImageUrlFromBase64(imageB64, userId);
        if (!imageUrl) {
            return res.status(500).json({message: "Error uploading image to Cloudinary from saved favourites"});
        }

        // Create a new saved favourite
        await SavedFavourites.create({
            userId,
            imageUrl,
            tag,
            occasion,
            description
        });

        return res.status(201).json({message: "Image added to saved favourites successfully"});
    } catch (error) {
        console.log("Error while adding to saved favourites:", error);
        return res.status(500).json({message: "Error while adding to saved favourites"});
    }
};

export const getSavedFavourites = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(400).json({message: "User unauthorized to access this feature"});
        }

        const savedFavourites = await SavedFavourites.find({ userId });

        if (!savedFavourites || savedFavourites.length === 0) {
            return res.status(404).json({message: "No saved favourites found"});
        }

        return res.status(200).json({message: "Favourites fetched successfully", count: savedFavourites.length, savedFavourites});
    } catch (error) {
        console.log("Error while fetching saved favourites:", error);
        return res.status(500).json({message: "Error while fetching saved favourites"});
    }
};

export const deleteSavedFavourite = async (req, res) => {
    try {
        const userId = req.user._id;
        const { favouriteId } = req.params;

        if (!userId) {
            return res.status(400).json({message: "User unauthorized to access this feature"});
        }

        if (!favouriteId) {
            return res.status(400).json({message: "Favourite ID is required"});
        }

        // Find the saved favourite
        const savedFavourite = await SavedFavourites.findOne({ _id: favouriteId, userId });

        if (!savedFavourite) {
            return res.status(404).json({message: "Saved favourite not found"});
        }

        // Delete image from Cloudinary
        await deleteFromCloudinary(savedFavourite.imageUrl);

        // Delete the saved favourite from the database
        await SavedFavourites.deleteOne({ _id: favouriteId });

        return res.status(200).json({message: "Saved favourite deleted successfully"});
    } catch (error) {
        console.log("Error while deleting saved favourite:", error);
        return res.status(500).json({message: "Error while deleting saved favourite"});
    }
};