import { Router } from "express";
import { getFashionNews } from "../controllers/homeScreen.controllers.js";

const router = Router();

router.get("/", getFashionNews);

export default router;