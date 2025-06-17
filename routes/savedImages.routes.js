import {Router} from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { addImageToSavedCollection, getSavedImages, removeFromSavedImages } from '../controllers/savedImages.controllers.js';
import { upload } from '../middleware/multer.middleware.js';

const router = Router();

router.post(
    '/addImage',
    verifyJWT,
    upload.fields([{ name: 'image', maxCount: 1 }]),
    addImageToSavedCollection
);
router.get('/getImages', verifyJWT, getSavedImages);
router.delete('/removeImage/:imageId', verifyJWT, removeFromSavedImages);
export default router;