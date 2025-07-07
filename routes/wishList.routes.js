import express from 'express';
import { toggleWishlistItem, getWishlistItems } from '../controllers/wishList.controllers.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/toggle', verifyJWT, toggleWishlistItem);
router.get('/show', verifyJWT, getWishlistItems);

export default router;
