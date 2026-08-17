import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  listCategories,
  createCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", listCategories);
router.post("/", requireAdmin, createCategory);

export default router;
