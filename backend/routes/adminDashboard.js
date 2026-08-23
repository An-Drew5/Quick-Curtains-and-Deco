import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  getAdminStats,
  updateOrderStatus,
} from "../controllers/adminDashboardController.js";

const router = express.Router();

router.put("/orders/:id/status", requireAdmin, updateOrderStatus);
router.get("/stats", requireAdmin, getAdminStats);

export default router;
