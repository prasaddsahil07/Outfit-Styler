import {Router} from 'express';
import { addUploadedLook, getUploadedLooks, deleteUploadedLook, getLookById } from '../controllers/uploadedLooks.controllers.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {upload} from "../middleware/multer.middleware.js";

const router = Router();

router.post('/addLook', verifyJWT, upload.single("image"), addUploadedLook);
router.get('/getLooks', verifyJWT, getUploadedLooks);
router.get('/look/:lookId', verifyJWT, getLookById);
router.delete('/deleteLook/:lookId', verifyJWT, deleteUploadedLook);

export default router;