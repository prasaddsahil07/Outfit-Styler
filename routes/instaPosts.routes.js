import {Router} from 'express';
import { getUserFashionInspo, showAffiliateLinkWithImage } from '../controllers/instaPosts.controllers.js';
import {upload} from "../middleware/multer.middleware.js";

const router = Router();

router.post('/dailyPost', upload.array('images', 10), showAffiliateLinkWithImage);
router.get('/dailyPostInstagram', getUserFashionInspo);

export default router;