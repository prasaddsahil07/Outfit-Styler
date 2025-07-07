import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        required: true
    },
    productId: { 
        type: String, 
        required: true 
    }, // unique affiliate product ID
    productTitle: {
        type: String,
        required: true
    },
    productImage: {
        type: String
    },
    price: {
        type: Number
    },
    originalPrice: {
        type: Number
    },
    discountPercent: {
        type: Number
    },
    platform: {
        type: String 
    },
    rating: {
        type: Number
    },
    productUrl: {
        type: Number
    }
}, {timestamps: true});

wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
