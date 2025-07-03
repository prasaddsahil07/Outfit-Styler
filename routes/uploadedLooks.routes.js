import {Router} from 'express';
import { addUploadedLook, getUploadedLooks, deleteUploadedLook } from '../controllers/uploadedLooks.controller.js';
import { verifyJWT } from '../middleware/auth.js';
import {upload} from "../middleware/multer.middleware.js";

const router = Router();

router.post('/addLook', verifyJWT, upload.single("image"), addUploadedLook);
router.get('/getLooks', verifyJWT, getUploadedLooks);
router.delete('/look/:lookId', verifyJWT, deleteUploadedLook);

export default router;