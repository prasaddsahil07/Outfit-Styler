import { extractClothingMetadata } from "../index.js";
import { DigitalWardrobe } from "../models/digitalWardrobe.models.js";
import { User } from "../models/users.models.js";
import fs from 'fs/promises';
import crypto from 'crypto';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';


function generateImageHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}


// GET all tag options (hardcoded here for UI dropdowns)
export const getTags = async (req, res) => {
    res.json({
        fabric: ["Cotton", "Linen", "Denim", "Satin", "Silk", "Chiffon", "Velvet", "Knit", "Lace", "Sequin", "Sheer"],
        occasion: ["Work", "Casual", "Semi-formal", "Formal", "Party", "Beach Vacation", "Mountain Vacation", "Weddings & Festivals", "Brunch", "Gym/Sports", "Travel"],
        // season: ["Winter", "Summer", "Autumn", "Monsoon"],
        category: ["Tops", "Bottoms", "Jeans", "Dresses", "Co-ords", "Jackets", "Sarees", "Kurta Sets", "Lehengas", "Indowestern", "Swimwear", "Lingerie", "Footwear", "Accessories", "Gowns"]
    });
};

export const addGarmentToDigitalWardrobe = async (req, res) => {
    try {
        const userId = req.user._id;
        const files = req.files || (req.file ? [req.file] : []);

        if (!files.length) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        for (const file of files) {
            const imageBuffer = await fs.readFile(file.path);
            const imageHash = generateImageHash(imageBuffer);

            // Check if image already exists
            const existing = await DigitalWardrobe.findOne({ userId, "uploadedImages.imageHash": imageHash });
            if (existing) {
                continue; // Skip this file if already exists
            }

            const base64Image = imageBuffer.toString("base64");
            const metadata = await extractClothingMetadata(base64Image, file.mimetype);

            if (!metadata || !Array.isArray(metadata)) {
                return res.status(400).json({ message: "Failed to extract garment metadata" });
            }

            const imageUrl = await uploadOnCloudinary(file.path);

            const garments = metadata.map(item => ({
                category: item.category,
                color: item.color,
                fabric: item.fabric,
                pattern: item.pattern,
                ai_tags: item.ai_tags,
                occasion: Array.isArray(item.occasion) ? item.occasion : [item.occasion],
                season: Array.isArray(item.season) ? item.season : [item.season],
            }));

            const imageEntry = {
                userId,
                imageUrl,
                imageHash,
                garments,
            };

            await DigitalWardrobe.findOneAndUpdate(
                { userId },
                { $push: { uploadedImages: imageEntry } },
                { upsert: true, new: true }
            );
        }

        // Ensure wardrobe is linked to user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.wardrobe) {
            const wardrobe = await DigitalWardrobe.findOne({ userId });
            user.wardrobe = wardrobe._id;
            await user.save();
        }

        return res.status(200).json({ message: "Garment(s) added to digital wardrobe" });
    } catch (error) {
        console.error("Error adding garment to wardrobe:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getMyWardrobe = async (req, res) => {
    try {
        const userId = req.user._id;

        const wardrobe = await DigitalWardrobe.findOne({ userId });

        // Return empty wardrobe structure instead of 404
        if (!wardrobe) {
            return res.status(200).json({
                userId,
                uploadedImages: []
            });
        }

        res.status(200).json(wardrobe);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch wardrobe', error: err.message });
    }
};


export const updateGarment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { garmentId } = req.params;
        const updatedFields = req.body;

        const wardrobe = await DigitalWardrobe.findOne({ userId });
        if (!wardrobe) return res.status(404).json({ message: 'Wardrobe not found' });

        const garment = wardrobe.garments.id(garmentId);
        if (!garment) return res.status(404).json({ message: 'Garment not found' });

        Object.assign(garment, updatedFields);
        await wardrobe.save();

        res.status(200).json({ message: 'Garment updated successfully', data: garment });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update garment', error: err.message });
    }
};

export const deleteGarment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { garmentId } = req.params;

    const wardrobe = await DigitalWardrobe.findOne({ userId });
    if (!wardrobe) return res.status(404).json({ message: 'Wardrobe not found' });

    const imageToDelete = wardrobe.uploadedImages.find(img => img._id.equals(garmentId));
    if (!imageToDelete) return res.status(404).json({ message: 'Garment image entry not found' });

    await deleteFromCloudinary(imageToDelete.imageUrl); // Delete image from Cloudinary

    await DigitalWardrobe.updateOne(
      { userId },
      { $pull: { uploadedImages: { _id: garmentId } } }
    );

    return res.status(200).json({ message: 'Garment image entry deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete garment', error: err.message });
  }
};

export const getGarmentsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }
        const wardrobe = await DigitalWardrobe.findOne({ userId: req.user._id });

        if (!wardrobe || wardrobe.garments.length === 0) {
            return res.status(404).json({ message: 'No garments found in wardrobe' });
        }

        const filtered = wardrobe.garments.filter(g => g.category === category);

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch garments by category' });
    }
};

export const getGarmentsByFabric = async (req, res) => {
    try {
        const { fabric } = req.params;

        if (!fabric) {
            return res.status(400).json({ message: 'Fabric is required' });
        }
        const wardrobe = await DigitalWardrobe.findOne({ userId: req.user._id });

        if (!wardrobe || wardrobe.garments.length === 0) {
            return res.status(404).json({ message: 'No garments found in wardrobe' });
        }

        const filtered = wardrobe.garments.filter(g => g.fabric === fabric);

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch garments by fabric' });
    }
}

export const getGarmentsByOccasion = async (req, res) => {
    try {
        const { occasion } = req.params;

        if (!occasion) {
            return res.status(400).json({ message: 'Occasion is required' });
        }
        const wardrobe = await DigitalWardrobe.findOne({ userId: req.user._id });

        if (!wardrobe || wardrobe.garments.length === 0) {
            return res.status(404).json({ message: 'No garments found in wardrobe' });
        }

        const filtered = wardrobe.garments.filter(g => g.occasion.includes(occasion));

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch garments by occasion' });
    }
}