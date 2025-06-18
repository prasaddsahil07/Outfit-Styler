import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";
import { registerUser, loginUser, logoutUser, getUserProfile, changeUserPassword, updateUserProfile, refreshAccessToken, getUserFullName } from "../controllers/users.controllers.js";
import {upload} from "../middleware/multer.middleware.js";

const router = Router();

// Register a new user
router.post("/register", upload.fields([{
    name: 'profilePicture',
    maxCount: 1
}]), registerUser);
// Login a user
router.post("/login", loginUser);
// Logout a user
router.post("/logout", verifyJWT, logoutUser);
// Get user profile
router.get("/profile", verifyJWT, getUserProfile);
// Get user fullName
router.get("/userName", verifyJWT, getUserFullName);
// Change user password
router.patch("/change-password", verifyJWT, changeUserPassword);
// Update user profile
router.patch("/update-profile", verifyJWT, updateUserProfile);
// Refresh access token
router.post("/refresh-token", refreshAccessToken);

export default router;