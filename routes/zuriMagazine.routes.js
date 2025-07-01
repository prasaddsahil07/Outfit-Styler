import {Router} from 'express';
import { getArticlesByCategory, getAllCategories  } from "../controllers/zuriMagazine.controllers.js";

const router = Router();

router.get('/allCategories', getAllCategories);
router.get('/articlesByCategory', getArticlesByCategory);

export default router;