import "dotenv/config";

import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import authRouter from "../routes/auth.js";
import adminDashboardRouter from "../routes/adminDashboard.js";
import adminProductsRouter from "../routes/adminProducts.js";
import adminOrdersRouter from "../routes/adminOrders.js";
import categoriesRouter from "../routes/categories.js";
import ordersRouter from "../routes/orders.js";
import productsRouter from "../routes/products.js";
import uploadsRouter from "../routes/uploads.js";
import webhooksRouter from "../routes/webhooks.js";
import errorHandler from "../middleware/errorHandler.js";

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  throw new Error(
    "FRONTEND_URL environment variable is required for CORS configuration",
  );
}

const app = express();

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(cookieParser());

// Signature verification requires the exact raw bytes from Paystack.
// If JSON parsing runs first, key-order/whitespace changes can invalidate the hash.
app.use("/api/webhooks/paystack", express.raw({ type: "application/json" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminDashboardRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrdersRouter);

app.use(errorHandler);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
