import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import { signature } from "../controllers/uploadController.js";

const router = express.Router();

router.get("/signature", requireAdmin, signature);

export default router;
