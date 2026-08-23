import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createMedia,
  deleteMedia,
  reorderMedia,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", requireAdmin, listProducts);
router.post("/", requireAdmin, createProduct);

router.post("/:productId/media", requireAdmin, createMedia);
router.delete("/:productId/media/:mediaId", requireAdmin, deleteMedia);
router.put("/:productId/media/reorder", requireAdmin, reorderMedia);

router.get("/:id", requireAdmin, getProductById);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
