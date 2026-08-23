import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  listProducts,
  getProductDetail,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createMedia,
  deleteMedia,
  reorderMedia,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", listProducts);
router.get("/by-id/:id", requireAdmin, getProductById);
router.get("/:slug", getProductDetail);
router.post("/", requireAdmin, createProduct);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

// Product media routes
router.post("/:productId/media", requireAdmin, createMedia);
router.delete("/:productId/media/:mediaId", requireAdmin, deleteMedia);
router.put("/:productId/media/reorder", requireAdmin, reorderMedia);

export default router;
