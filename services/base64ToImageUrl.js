import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs';
import path from 'path';

export const getImageUrlFromBase64 = async (imageB64, userId) => {
    let tempFilePath = null;
    try {
        const base64Data = imageB64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Create temporary file
        const tempDir = './temp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        tempFilePath = path.join(tempDir, `temp_${Date.now()}_${userId}.jpg`);
        fs.writeFileSync(tempFilePath, buffer);

        // Upload image to Cloudinary
        const imageUrl = await uploadOnCloudinary(tempFilePath);

        if (!imageUrl) {
            console.error("Error uploading image to Cloudinary");
            return null;
        }

        return imageUrl;
    } catch (error) {
        console.error("Error in getImageUrlFromBase64:", error);
        return null;
    } finally {
        // Clean up temporary file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupError) {
                console.log("Error cleaning up temp file:", cleanupError);
            }
        }
    }
}