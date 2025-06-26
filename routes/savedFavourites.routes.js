import {Router} from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { addToSavedFavourites, getSavedFavourites, deleteSavedFavourite } from "../controllers/savedFavourites.controllers.js";
// import { upload } from '../middleware/multer.middleware.js';

const router = Router();

// expecting a base64 image in the request body so no need to use multer
router.post('/addFavourite', verifyJWT, addToSavedFavourites);
router.get('/getFavourites', verifyJWT, getSavedFavourites);
router.delete('/deleteFavourite/:favouriteId', verifyJWT, deleteSavedFavourite);

export default router;