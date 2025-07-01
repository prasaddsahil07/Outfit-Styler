import { Router } from 'express';
import { getAllBookmarkedArticles, toggleBookmark } from '../controllers/bookMarkArticles.controllers.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/toggleBookmark/:articleId', verifyJWT, toggleBookmark);
router.get('/getBookmarks', verifyJWT, getAllBookmarkedArticles);

export default router;