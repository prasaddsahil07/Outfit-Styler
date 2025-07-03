import { UploadedLooks } from "../models/uploadedLooksModel.js";
import { validateChatbotImage } from "../services/validateChatbotImage.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { addToWardrobe } from "../services/addToWardrobe.js";

// add to uploaded looks
export const addUploadedLook = async (req, res) => {
    const user = req.user;
    const imageFile = req.file;
    const { userQuery = '' } = req.query || {};

    if (!user || !imageFile) {
        return res.status(400).json({ message: "User or image file is missing" });
    }

    try {
        // Step 1: Upload to Cloudinary
        const imageUrl = await uploadOnCloudinary(imageFile.path);
        if (!imageUrl) {
            return res.status(500).json({ message: "Error uploading image to Cloudinary" });
        }

        // Step 2: Validate image for fashion + full body
        const validationResult = await validateChatbotImage(imageUrl, userQuery);
        const { containsFullBodyHuman, generatedTitle, containsFashionItem } = validationResult;

        // Step 3: If not a full-body human, skip uploaded look
        if (!containsFullBodyHuman) {
            console.log("Image does not contain a full-body human, skipping uploaded look");
            await deleteFromCloudinary(imageUrl); // cleanup
            return res.status(204).json({
                message: "Image skipped: no full-body human",
                data: null
            });
        }

        // Step 4: Save to UploadedLooks
        const newLook = new UploadedLooks({
            userId: user._id,
            imageUrl,
            title: generatedTitle || "Your Uploaded Look"
        });

        await newLook.save();

        // Step 5: If it's a valid fashion item, silently add to wardrobe
        if (containsFashionItem) {
            await addToWardrobe(user._id, [{
                path: imageFile.path,
                mimetype: imageFile.mimetype,
                filename: imageFile.originalname
            }]);
        } else {
            // clean up local file if not added to wardrobe
            await fs.unlink(imageFile.path).catch(() => { });
        }

        return res.status(201).json({
            message: "Look uploaded successfully",
            data: newLook
        });

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

// get a look by id
export const getLookById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { lookId } = req.params;
        const look = await UploadedLooks.findOne({ _id: lookId, userId });
        if (!look) {
            return res.status(404).json({ message: 'Look not found or not authorized to access.' });
        }
        res.status(200).json({ look });
    } catch (error) {
        console.error('Error fetching look:', error);
        res.status(500).json({ message: 'Failed to fetch look', error: error.message });
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