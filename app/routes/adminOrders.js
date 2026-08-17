import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  getAdminOrderById,
  listAdminOrders,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", requireAdmin, listAdminOrders);
router.get("/:id", requireAdmin, getAdminOrderById);

export default router;
