import { Router } from 'express';
import { addGarmentToDigitalWardrobe, getMyWardrobe, updateGarment, deleteGarment, getTags, getGarmentsByCategory, getGarmentsByFabric, getGarmentsByOccasion } from "../controllers/digitalWardrobe.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.get("/tags", verifyJWT, getTags);
router.post("/addTowardrobe", verifyJWT, upload.array("images", 5), addGarmentToDigitalWardrobe);
router.get("/myWardrobe", verifyJWT, getMyWardrobe);
router.put("/updateGarment/:garmentId", verifyJWT, updateGarment);
router.delete("/deleteGarment/:garmentId", verifyJWT, deleteGarment);
router.get("/garments/category/:category", verifyJWT, getGarmentsByCategory);
router.get("/garments/fabric/:fabric", verifyJWT, getGarmentsByFabric);
router.get("/garments/occasion/:occasion", verifyJWT, getGarmentsByOccasion);

export default router;