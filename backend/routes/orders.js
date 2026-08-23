import express from "express";
import {
  createOrderAndInitializePayment,
  verifyOrderByReference,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrderAndInitializePayment);
router.get("/verify/:reference", verifyOrderByReference);

export default router;
