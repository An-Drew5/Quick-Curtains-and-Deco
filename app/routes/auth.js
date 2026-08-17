import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import { login, logout, me } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAdmin, me);

export default router;
