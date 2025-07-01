import { Router } from 'express';
import {
  getAllCategories,
  getArticlesByCategory,
  getAllArticles,
  addArticle,
  updateArticle,
  deleteArticle,
  getArticleById
} from "../controllers/zuriMagazine.controllers.js";
import { upload } from '../middleware/multer.middleware.js';

const router = Router();

// USER-FACING ROUTES
router.get('/allCategories', getAllCategories);
router.get('/articlesByCategory', getArticlesByCategory);
router.get('/allArticles', getAllArticles);
router.get('/article/:id', getArticleById);

// ADMIN ROUTES
router.post('/addArticle', upload.single("bannerImage"), addArticle);
router.put('/updateArticle/:id', upload.single("bannerImage"), updateArticle);
router.delete('/deleteArticle/:id', deleteArticle);

export default router;
