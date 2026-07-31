import express from "express";
import {
  register,
  login,
  googleLogin,
  completeProfile,
  getProfile,
} from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/complete-profile", authenticate, completeProfile);
router.get("/profile", authenticate, getProfile);

export default router;
