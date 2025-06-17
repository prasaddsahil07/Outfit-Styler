import { Router } from "express";
import { dailyPostFromInstagram } from "../controllers/dailyPost.controllers.js";

const router = Router();

// Route to get daily post from Instagram
router.get("/:id", dailyPostFromInstagram);

export default router;