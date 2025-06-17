import {Router} from 'express';
import {styleRecommenderController} from "../controllers/styleRecommender.controllers.js";
import {upload} from "../middleware/multer.middleware.js";

const router = Router();

router.post('/', upload.array('images', 4), styleRecommenderController);

export default router;