import mongoose from "mongoose";

const instaPostsSchema = new mongoose.Schema({
    imageUrl: String,
    caption: String,
    uploadedAt: Date,
    processed: Boolean,
    affiliateLinks: [
        {
            keyword: String,
            source: String,
            title: String,
            original_link: String,
            affiliated_link: String,
            thumbnail: String
        }
    ]
});

export const InstaPosts = mongoose.model('InstaPosts', instaPostsSchema);
