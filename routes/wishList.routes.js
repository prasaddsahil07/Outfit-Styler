import express from 'express';
import { toggleWishlistItem, getWishlistItems } from '../controllers/wishlist.controller.js';
import { verifyJWT, verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/toggle', verifyToken, toggleWishlistItem);
router.get('/show', verifyJWT, getWishlistItems);

export default router;
