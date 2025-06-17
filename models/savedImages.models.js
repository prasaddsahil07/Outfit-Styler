import mongoose from "mongoose";

const savedImageSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    tags: [String],
    occasion: String,
    createdAt: { type: Date, default: Date.now }
});

export const SavedImage = mongoose.model("SavedImage", savedImageSchema);