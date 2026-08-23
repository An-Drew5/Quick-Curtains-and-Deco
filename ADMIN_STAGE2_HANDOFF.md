# Admin Stage 2 Handoff

## Behavior Flags
- is_custom filtering: EXISTS. Backend parses query param is_custom in app/controllers/productController.js listProducts and filters true/false accordingly.
- Category delete with linked products: BLOCKED. Backend returns 409 in app/controllers/categoryController.js deleteCategory when _count.products > 0.

## Server Verification
- Frontend dev: next dev running on http://localhost:3000 and /admin/login returns 200.
- Admin-only checks (without auth): /api/admin/orders, /api/admin/orders/:id, /api/admin/products/:id return 401.

## Route Smoke Results
- /admin/orders -> 200
- /admin/orders/123 -> 200
- /admin/gallery -> 200
- /admin/gallery/new -> 200
- /admin/gallery/123/edit -> 200
- /admin/categories -> 200

## Changed/New File Contents

### app/controllers/categoryController.js
```
import prisma from "../lib/prisma.js";
import { validateNonEmptyString } from "../utils/validation.js";

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const { name, slug } = req.body;
    const errors = [];

    const nameError = validateNonEmptyString(name, "name");
    const slugError = validateNonEmptyString(slug, "slug");

    if (nameError) errors.push(nameError);
    if (slugError) errors.push(slugError);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return res
        .status(409)
        .json({ success: false, error: "Category slug already exists." });
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    const errors = [];

    const idError = validateNonEmptyString(id, "id");
    const nameError = validateNonEmptyString(name, "name");
    const slugError = validateNonEmptyString(slug, "slug");

    if (idError) errors.push(idError);
    if (nameError) errors.push(nameError);
    if (slugError) errors.push(slugError);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Category not found." });
    }

    const slugConflict = await prisma.category.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (slugConflict) {
      return res
        .status(409)
        .json({ success: false, error: "Category slug already exists." });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const idError = validateNonEmptyString(id, "id");
    if (idError) {
      return res.status(400).json({ success: false, error: idError });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Category not found." });
    }

    if (existing._count.products > 0) {
      return res.status(409).json({
        success: false,
        error:
          "Cannot delete category with linked products. Move or delete those products first.",
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.json({
      success: true,
      data: { message: "Category deleted successfully." },
    });
  } catch (error) {
    next(error);
  }
}

export { listCategories, createCategory, updateCategory, deleteCategory };
```

### app/routes/categories.js
```
import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", listCategories);
router.post("/", requireAdmin, createCategory);
router.put("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;
```

### app/controllers/productController.js
```
import prisma from "../lib/prisma.js";
import {
  validateNonEmptyString,
  validateProductPayload,
} from "../utils/validation.js";
import cloudinary from "../lib/cloudinary.js";

function buildProductResponse(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    is_custom: product.is_custom,
    stock_status: product.stock_status,
    created_at: product.created_at,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    thumbnail: product.media?.length
      ? {
          id: product.media[0].id,
          url: product.media[0].url,
          type: product.media[0].type,
          sort_order: product.media[0].sort_order,
        }
      : null,
  };
}

async function listProducts(req, res, next) {
  try {
    const { category, search, page = 1, limit = 20, is_custom } = req.query;
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 20;

    const filters = {};

    if (is_custom !== undefined) {
      const normalizedIsCustom = String(is_custom).toLowerCase();
      if (normalizedIsCustom === "true") {
        filters.is_custom = true;
      } else if (normalizedIsCustom === "false") {
        filters.is_custom = false;
      }
    }

    if (category) {
      filters.category = { slug: category };
    }

    if (search) {
      filters.name = { contains: search, mode: "insensitive" };
    }

    const total = await prisma.product.count({ where: filters });
    const products = await prisma.product.findMany({
      where: filters,
      orderBy: { created_at: "desc" },
      skip: (pageNumber - 1) * pageLimit,
      take: pageLimit,
      include: {
        category: true,
        media: {
          orderBy: { sort_order: "asc" },
          take: 1,
        },
      },
    });

    const transformed = products.map(buildProductResponse);
    const totalPages = Math.ceil(total / pageLimit);

    res.json({
      success: true,
      data: {
        products: transformed,
        total,
        page: pageNumber,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        media: {
          orderBy: { sort_order: "asc" },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function getProductDetail(req, res, next) {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        media: {
          orderBy: { sort_order: "asc" },
        },
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const payload = req.body;
    const errors = validateProductPayload(payload);

    const requiredFields = [
      "name",
      "slug",
      "category_id",
      "price",
      "stock_status",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        payload[field] === undefined ||
        payload[field] === null ||
        payload[field] === "",
    );
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(", ")}.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug: payload.slug },
    });

    if (existingProduct) {
      return res
        .status(409)
        .json({ success: false, error: "Product slug already exists." });
    }

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description || null,
        price: payload.price,
        is_custom: payload.is_custom ?? false,
        stock_status: payload.stock_status,
        category: { connect: { id: payload.category_id } },
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const { id } = req.params;
    const payload = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Product ID is required." });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    const errors = validateProductPayload(payload);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const data = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.slug !== undefined) data.slug = payload.slug;
    if (payload.description !== undefined)
      data.description = payload.description;
    if (payload.price !== undefined) data.price = payload.price;
    if (payload.is_custom !== undefined) data.is_custom = payload.is_custom;
    if (payload.stock_status !== undefined)
      data.stock_status = payload.stock_status;
    if (payload.category_id !== undefined)
      data.category = { connect: { id: payload.category_id } };

    if (data.slug && data.slug !== existingProduct.slug) {
      const conflict = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (conflict) {
        return res
          .status(409)
          .json({ success: false, error: "Product slug already exists." });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    await prisma.$transaction([
      prisma.productMedia.deleteMany({ where: { product_id: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.json({
      success: true,
      data: { message: "Product deleted successfully." },
    });
  } catch (error) {
    next(error);
  }
}

async function createMedia(req, res, next) {
  try {
    const { productId } = req.params;
    const { url, type, sort_order } = req.body;

    if (!url || !type) {
      return res
        .status(400)
        .json({ success: false, error: "url and type are required." });
    }

    if (!["image", "video"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: "type must be 'image' or 'video'." });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    const created = await prisma.productMedia.create({
      data: {
        product_id: productId,
        url,
        type,
        sort_order: sort_order ?? 0,
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function deleteMedia(req, res, next) {
  try {
    const { productId, mediaId } = req.params;

    const media = await prisma.productMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media || media.product_id !== productId) {
      return res
        .status(404)
        .json({ success: false, error: "Media not found." });
    }

    // Deleting the remote asset requires storing the Cloudinary public_id.
    // If the `public_id` field is not present on the model, we cannot
    // reliably delete the asset from Cloudinary using only the URL.
    if (media.public_id) {
      const resourceType = media.type === "video" ? "video" : "image";
      try {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: resourceType,
        });
      } catch (err) {
        // Log and continue to delete DB record; do not block admin UX.
        console.warn("Failed to delete Cloudinary asset:", err?.message || err);
      }
    } else {
      // If public_id isn't stored, notify in response that remote deletion
      // was skipped and advise adding `public_id` to ProductMedia model.
      console.warn(
        "Media has no public_id; remote Cloudinary deletion skipped.",
      );
    }

    await prisma.productMedia.delete({ where: { id: mediaId } });

    res.json({ success: true, data: { message: "Media deleted." } });
  } catch (error) {
    next(error);
  }
}

async function reorderMedia(req, res, next) {
  try {
    const { productId } = req.params;
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res
        .status(400)
        .json({ success: false, error: "order must be an array." });
    }

    const updates = order.map((item) =>
      prisma.productMedia.update({
        where: { id: item.id },
        data: { sort_order: item.sort_order },
      }),
    );

    await prisma.$transaction(updates);

    res.json({ success: true, data: { message: "Order updated." } });
  } catch (error) {
    next(error);
  }
}

export {
  listProducts,
  getProductDetail,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createMedia,
  deleteMedia,
  reorderMedia,
};
```

### app/routes/adminProducts.js
```
import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import { getProductById } from "../controllers/productController.js";

const router = express.Router();

router.get("/:id", requireAdmin, getProductById);

export default router;
```

### app/controllers/orderController.js
```
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import {
  getDeliveryFlatFee,
  initializePaystackTransaction,
  toMinorUnit,
  verifyPaystackTransaction,
} from "../lib/paystack.js";
import { applyTransactionPaymentResult } from "../services/paymentService.js";

const NON_ORDERABLE_STOCK_STATUSES = new Set([
  "out_of_stock",
  "sold_out",
  "unavailable",
  "discontinued",
]);
const IDEMPOTENCY_RACE_RETRY_ATTEMPTS = 2;
const IDEMPOTENCY_RACE_RETRY_DELAY_MS = 150;

function validateNonEmpty(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    return `${fieldName} is required and must be a non-empty string.`;
  }
  return null;
}

function roundBaseCurrency(value) {
  return Number(value.toFixed(2));
}

function ensureOrderableStockStatus(stockStatus) {
  const normalized = String(stockStatus || "")
    .trim()
    .toLowerCase();

  if (!normalized || NON_ORDERABLE_STOCK_STATUSES.has(normalized)) {
    return false;
  }

  return true;
}

function mapAndValidateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "items must be a non-empty array." };
  }

  const quantitiesByProductId = new Map();

  for (const item of items) {
    if (!item || typeof item !== "object") {
      return {
        error: "Each item must be an object with product_id and quantity.",
      };
    }

    const productIdError = validateNonEmpty(item.product_id, "product_id");
    if (productIdError) {
      return { error: productIdError };
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: "quantity must be a positive integer for each item." };
    }

    const existingQty = quantitiesByProductId.get(item.product_id) || 0;
    quantitiesByProductId.set(item.product_id, existingQty + quantity);
  }

  return { quantitiesByProductId };
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function buildIdempotencyPaymentUnavailableError(message) {
  const error = new Error(message);
  error.statusCode = 502;
  error.code = "PAYMENT_PROVIDER_UNAVAILABLE";
  return error;
}

function buildIdempotencyRetryReference(orderId) {
  return `qcd_${orderId}_retry`;
}

function getFrontendBaseUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

function buildOrderCallbackUrl(reference) {
  const frontendBaseUrl = getFrontendBaseUrl();
  return `${frontendBaseUrl}/order/confirmation?reference=${encodeURIComponent(reference)}`;
}

function isIdempotencyConflict(error) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2002") {
    return false;
  }

  const targets = Array.isArray(error.meta?.target)
    ? error.meta.target
    : [error.meta?.target].filter(Boolean);

  return targets.includes("idempotency_key");
}

async function getOrderPaymentSession(orderId) {
  const transaction = await prisma.transaction.findFirst({
    where: { order_id: orderId },
    select: {
      paystack_reference: true,
      authorization_url: true,
    },
  });

  if (!transaction?.paystack_reference || !transaction.authorization_url) {
    return null;
  }

  return {
    order_id: orderId,
    authorization_url: transaction.authorization_url,
    reference: transaction.paystack_reference,
  };
}

async function getOrderTransaction(orderId) {
  return prisma.transaction.findFirst({
    where: { order_id: orderId },
    select: {
      id: true,
      paystack_reference: true,
      authorization_url: true,
    },
  });
}

async function findOrderPaymentSessionWithRaceRetry(orderId) {
  for (
    let attempt = 0;
    attempt < IDEMPOTENCY_RACE_RETRY_ATTEMPTS;
    attempt += 1
  ) {
    const paymentSession = await getOrderPaymentSession(orderId);
    if (paymentSession) {
      return paymentSession;
    }

    if (attempt < IDEMPOTENCY_RACE_RETRY_ATTEMPTS - 1) {
      await sleep(IDEMPOTENCY_RACE_RETRY_DELAY_MS);
    }
  }

  return null;
}

async function createOrRepairPaymentSessionForExistingOrder(order) {
  if (!order?.id) {
    return null;
  }

  if (!order.email || String(order.email).trim() === "") {
    throw buildIdempotencyPaymentUnavailableError(
      "Payment could not be retried for this order because the customer email is missing.",
    );
  }

  const existingTransaction = await getOrderTransaction(order.id);
  const paystackReference =
    existingTransaction?.paystack_reference ||
    buildIdempotencyRetryReference(order.id);
  const amountMinorUnit = toMinorUnit(Number(order.total_amount));

  let paystackInit;
  try {
    paystackInit = await initializePaystackTransaction({
      email: String(order.email).trim(),
      amountMinorUnit,
      metadata: {
        order_id: order.id,
      },
      reference: paystackReference,
      callbackUrl: buildOrderCallbackUrl(paystackReference),
    });
  } catch (_error) {
    throw buildIdempotencyPaymentUnavailableError(
      "Payment service is temporarily unavailable. Please try again.",
    );
  }

  try {
    const latestTransaction = await getOrderTransaction(order.id);

    if (
      latestTransaction?.authorization_url &&
      latestTransaction?.paystack_reference
    ) {
      return {
        order_id: order.id,
        authorization_url: latestTransaction.authorization_url,
        reference: latestTransaction.paystack_reference,
      };
    }

    if (latestTransaction) {
      const updatedTransaction = await prisma.transaction.update({
        where: { id: latestTransaction.id },
        data: {
          authorization_url: paystackInit.authorization_url,
        },
        select: {
          paystack_reference: true,
          authorization_url: true,
        },
      });

      return {
        order_id: order.id,
        authorization_url: updatedTransaction.authorization_url,
        reference: updatedTransaction.paystack_reference,
      };
    }

    const createdTransaction = await prisma.transaction.create({
      data: {
        order_id: order.id,
        paystack_reference: paystackInit.reference,
        authorization_url: paystackInit.authorization_url,
        amount: Number(order.total_amount).toFixed(2),
        status: "pending",
      },
      select: {
        paystack_reference: true,
        authorization_url: true,
      },
    });

    return {
      order_id: order.id,
      authorization_url: createdTransaction.authorization_url,
      reference: createdTransaction.paystack_reference,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const paymentSession = await findOrderPaymentSessionWithRaceRetry(
        order.id,
      );
      if (paymentSession) {
        return paymentSession;
      }
    }

    throw error;
  }
}

async function findExistingOrderResponseByIdempotencyKey(idempotencyKey) {
  const existingOrder = await prisma.order.findUnique({
    where: { idempotency_key: idempotencyKey },
    select: {
      id: true,
      email: true,
      total_amount: true,
    },
  });

  if (!existingOrder) {
    return null;
  }

  const paymentSession = await findOrderPaymentSessionWithRaceRetry(
    existingOrder.id,
  );
  if (paymentSession) {
    return paymentSession;
  }

  return createOrRepairPaymentSessionForExistingOrder(existingOrder);
}

export async function createOrderAndInitializePayment(req, res, next) {
  try {
    const { customer_name, phone, email, address, items, idempotency_key } =
      req.body;

    const idempotencyKeyError = validateNonEmpty(
      idempotency_key,
      "idempotency_key",
    );
    if (idempotencyKeyError) {
      return res
        .status(400)
        .json({ success: false, error: idempotencyKeyError });
    }

    const normalizedIdempotencyKey = idempotency_key.trim();

    let existingOrderResponse;
    try {
      existingOrderResponse = await findExistingOrderResponseByIdempotencyKey(
        normalizedIdempotencyKey,
      );
    } catch (lookupError) {
      if (lookupError?.code === "PAYMENT_PROVIDER_UNAVAILABLE") {
        return res.status(502).json({
          success: false,
          error: lookupError.message,
        });
      }

      throw lookupError;
    }

    if (
      existingOrderResponse?.authorization_url &&
      existingOrderResponse.reference
    ) {
      return res.json({ success: true, data: existingOrderResponse });
    }

    const fieldErrors = [
      validateNonEmpty(customer_name, "customer_name"),
      validateNonEmpty(phone, "phone"),
      validateNonEmpty(email, "email"),
      validateNonEmpty(address, "address"),
    ].filter(Boolean);

    if (fieldErrors.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: fieldErrors.join(" ") });
    }

    const { error: itemsError, quantitiesByProductId } =
      mapAndValidateItems(items);
    if (itemsError) {
      return res.status(400).json({ success: false, error: itemsError });
    }

    const productIds = [...quantitiesByProductId.keys()];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        is_custom: true,
        stock_status: true,
      },
    });

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    for (const productId of productIds) {
      const product = productById.get(productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${productId} was not found.`,
        });
      }

      if (product.is_custom) {
        return res.status(400).json({
          success: false,
          error:
            "Custom/gallery products cannot be purchased through checkout. Please use WhatsApp enquiry for this item.",
        });
      }

      if (!ensureOrderableStockStatus(product.stock_status)) {
        return res.status(400).json({
          success: false,
          error: `Product \"${product.name}\" is currently not available for ordering.`,
        });
      }
    }

    const deliveryFee = roundBaseCurrency(getDeliveryFlatFee());
    const orderItemsInput = [];
    let subtotalBase = 0;

    for (const [productId, quantity] of quantitiesByProductId.entries()) {
      const product = productById.get(productId);
      const unitPrice = Number(product.price);
      const lineSubtotal = roundBaseCurrency(unitPrice * quantity);

      subtotalBase += lineSubtotal;

      orderItemsInput.push({
        product_id: productId,
        quantity,
        unit_price: unitPrice.toFixed(2),
        subtotal: lineSubtotal.toFixed(2),
      });
    }

    const totalAmountBase = roundBaseCurrency(subtotalBase + deliveryFee);

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          idempotency_key: normalizedIdempotencyKey,
          customer_name: customer_name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          order_type: "full_purchase",
          status: "pending",
          total_amount: totalAmountBase.toFixed(2),
          delivery_fee: deliveryFee.toFixed(2),
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsInput.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
      });

      return order;
    });

    // Paystack expects the amount in the smallest currency unit.
    // This uses a x100 conversion (e.g. NGN naira -> kobo, GHS cedi -> pesewas).
    const amountMinorUnit = toMinorUnit(totalAmountBase);
    const paystackReference = `qcd_${createdOrder.id}_${Date.now()}`;
    const callbackUrl = buildOrderCallbackUrl(paystackReference);

    const paystackInit = await initializePaystackTransaction({
      email: email.trim(),
      amountMinorUnit,
      metadata: {
        order_id: createdOrder.id,
      },
      reference: paystackReference,
      callbackUrl,
    });

    await prisma.transaction.create({
      data: {
        order_id: createdOrder.id,
        paystack_reference: paystackInit.reference,
        authorization_url: paystackInit.authorization_url,
        amount: totalAmountBase.toFixed(2),
        status: "pending",
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        order_id: createdOrder.id,
        authorization_url: paystackInit.authorization_url,
        reference: paystackInit.reference,
      },
    });
  } catch (error) {
    if (isIdempotencyConflict(error)) {
      try {
        const existingOrderResponse =
          await findExistingOrderResponseByIdempotencyKey(
            req.body?.idempotency_key?.trim(),
          );

        if (
          existingOrderResponse?.authorization_url &&
          existingOrderResponse.reference
        ) {
          return res.json({ success: true, data: existingOrderResponse });
        }
      } catch (lookupError) {
        if (lookupError?.code === "PAYMENT_PROVIDER_UNAVAILABLE") {
          return res.status(502).json({
            success: false,
            error: lookupError.message,
          });
        }

        // Fall through to the shared error handler if the recovery lookup fails.
      }
    }

    next(error);
  }
}

export async function verifyOrderByReference(req, res, next) {
  try {
    const { reference } = req.params;
    const referenceError = validateNonEmpty(reference, "reference");
    if (referenceError) {
      return res.status(400).json({ success: false, error: referenceError });
    }

    const verification = await verifyPaystackTransaction(reference);

    const paystackStatus = String(verification?.status || "").toLowerCase();

    let updateResult = { transaction: null, order: null };
    if (paystackStatus === "success") {
      updateResult = await applyTransactionPaymentResult({
        reference,
        status: "success",
        source: "verify_endpoint",
      });
    } else if (["failed", "abandoned", "reversed"].includes(paystackStatus)) {
      updateResult = await applyTransactionPaymentResult({
        reference,
        status: "failed",
        source: "verify_endpoint",
      });
    } else {
      const existing = await prisma.transaction.findUnique({
        where: { paystack_reference: reference },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Transaction reference not found in local records.",
        });
      }

      const existingOrder = await prisma.order.findUnique({
        where: { id: existing.order_id },
      });
      updateResult = { transaction: existing, order: existingOrder };
    }

    if (!updateResult.transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction reference not found in local records.",
      });
    }

    return res.json({
      success: true,
      data: {
        reference,
        transaction_status: updateResult.transaction.status,
        order_status: updateResult.order.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminOrders(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 20;

    const where = {};
    if (status) {
      where.status = String(status);
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (pageNumber - 1) * pageLimit,
        take: pageLimit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          transactions: {
            orderBy: { verified_at: "desc" },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        orders,
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const idError = validateNonEmpty(id, "id");
    if (idError) {
      return res.status(400).json({ success: false, error: idError });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                stock_status: true,
              },
            },
          },
        },
        transactions: {
          orderBy: { verified_at: "desc" },
        },
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, error: "Order not found." });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}
```

### app/routes/adminOrders.js
```
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
```

### app/controllers/adminDashboardController.js
```
import prisma from "../lib/prisma.js";

const VALID_ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

const PAID_ORDER_STATUSES = ["paid", "shipped", "delivered"];

function normalizeStatus(status) {
  return typeof status === "string" ? status.trim().toLowerCase() : "";
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || typeof id !== "string" || id.trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: "Order id is required." });
    }

    const normalizedStatus = normalizeStatus(status);
    if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid values are: ${VALID_ORDER_STATUSES.join(", ")}.`,
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, error: "Order not found." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: normalizedStatus },
    });

    return res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
}

export async function getAdminStats(req, res, next) {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      ordersToday,
      pendingOrders,
      revenueThisWeek,
      revenueThisMonth,
      recentOrders,
      outOfStockCount,
      outOfStockProducts,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          created_at: {
            gte: startOfDay,
            lte: now,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: "pending",
        },
      }),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: {
          status: { in: PAID_ORDER_STATUSES },
          created_at: {
            gte: sevenDaysAgo,
            lte: now,
          },
        },
      }),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: {
          status: { in: PAID_ORDER_STATUSES },
          created_at: {
            gte: thirtyDaysAgo,
            lte: now,
          },
        },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          customer_name: true,
          total_amount: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.product.count({
        where: {
          stock_status: "out_of_stock",
        },
      }),
      prisma.product.findMany({
        where: {
          stock_status: "out_of_stock",
        },
        select: {
          id: true,
          name: true,
        },
        take: 10,
      }),
    ]);

    const serializedRecentOrders = recentOrders.map((order) => ({
      ...order,
      total_amount: Number(order.total_amount),
    }));

    return res.json({
      success: true,
      data: {
        orders_today: ordersToday,
        pending_orders: pendingOrders,
        revenue_this_week: Number(revenueThisWeek._sum.total_amount || 0),
        revenue_this_month: Number(revenueThisMonth._sum.total_amount || 0),
        recent_orders: serializedRecentOrders,
        out_of_stock_count: outOfStockCount,
        out_of_stock_products: outOfStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
}
```

### app/routes/adminDashboard.js
```
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
```

### frontend/components/admin/ProductForm.jsx
```
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";

const STOCK_OPTIONS = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "made_to_order", label: "Made to Order" },
];

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export default function ProductForm({
  mode = "create",
  initialProduct = null,
  hidePrice = false,
  lockIsCustom = false,
  isCustomValue = false,
  redirectPath = "/admin/products",
  entityLabel = "product",
}) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaItems, setMediaItems] = useState(initialProduct?.media || []);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProduct?.slug));

  const [form, setForm] = useState({
    name: initialProduct?.name || "",
    slug: initialProduct?.slug || "",
    category_id: initialProduct?.category?.id || "",
    description: initialProduct?.description || "",
    price: initialProduct?.price || "",
    stock_status: initialProduct?.stock_status || "in_stock",
    is_custom: lockIsCustom
      ? isCustomValue
      : (initialProduct?.is_custom ?? false),
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const payload = await apiFetch("/api/categories");
        setCategories(payload.data || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setCategoryLoading(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (!slugTouched && form.name) {
      setForm((current) => ({ ...current, slug: slugify(current.name) }));
    }
  }, [form.name, slugTouched]);

  useEffect(() => {
    if (initialProduct?.media) {
      setMediaItems(initialProduct.media);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (lockIsCustom) {
      setForm((current) => ({
        ...current,
        is_custom: isCustomValue,
      }));
    }
  }, [lockIsCustom, isCustomValue]);

  const productId = initialProduct?.id || null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCloudinaryUpload(file) {
    if (!file) return;
    if (!productId) {
      setError(`Save the ${entityLabel} before uploading media.`);
      return;
    }

    try {
      setImageLoading(true);
      setError("");

      const signatureResponse = await apiFetch("/api/uploads/signature");
      const { signature, timestamp, cloudName, apiKey, folder } =
        signatureResponse.data;

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("timestamp", String(timestamp));
      cloudinaryFormData.append("signature", signature);
      cloudinaryFormData.append("folder", folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: cloudinaryFormData,
        },
      );

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.error?.message || "Image upload failed.");
      }

      const mediaPayload = {
        url: uploadData.secure_url,
        type: uploadData.resource_type === "video" ? "video" : "image",
        sort_order: mediaItems.length,
      };

      const savedMedia = await apiFetch(`/api/products/${productId}/media`, {
        method: "POST",
        body: JSON.stringify(mediaPayload),
      });

      setMediaItems((current) => [...current, savedMedia.data]);
    } catch (uploadError) {
      setError(uploadError.message || "Image upload failed.");
    } finally {
      setImageLoading(false);
    }
  }

  async function handleDeleteMedia(mediaId) {
    if (!productId) return;

    const confirmed = window.confirm("Delete this image?");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/products/${productId}/media/${mediaId}`, {
        method: "DELETE",
      });
      setMediaItems((current) => current.filter((item) => item.id !== mediaId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function moveMedia(index, direction) {
    if (!productId || index < 0 || !mediaItems[index]) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mediaItems.length) return;

    const updated = [...mediaItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    const orderedMedia = updated.map((item, itemIndex) => ({
      id: item.id,
      sort_order: itemIndex,
    }));

    setMediaItems(updated);

    try {
      await apiFetch(`/api/products/${productId}/media/reorder`, {
        method: "PUT",
        body: JSON.stringify({ order: orderedMedia }),
      });
    } catch (reorderError) {
      setError(reorderError.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();
    const numericPrice = Number(form.price || 0);

    if (!trimmedName || !trimmedSlug || !form.category_id) {
      setError("Please complete all required fields.");
      setLoading(false);
      return;
    }

    if (!hidePrice && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
      setError("Please provide a valid price greater than 0.");
      setLoading(false);
      return;
    }

    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      category_id: form.category_id,
      description: form.description.trim(),
      price: hidePrice ? "0.00" : numericPrice.toFixed(2),
      stock_status: form.stock_status,
      is_custom: lockIsCustom ? isCustomValue : form.is_custom,
    };

    try {
      if (mode === "edit" && initialProduct?.id) {
        await apiFetch(`/api/products/${initialProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      router.push(redirectPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError.message
          .replace(/^API error \(\d+\):\s*/, "")
          .trim() || "Could not save. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Name</label>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              placeholder="Luna Linen Curtain Set"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Slug</label>
            <input
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                updateField("slug", event.target.value);
              }}
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              placeholder="luna-linen-curtain-set"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Category</label>
            {categoryLoading ? (
              <div className="rounded-xl border border-navy/10 bg-offwhite2 px-3 py-3 text-sm text-muted">
                Loading categories...
              </div>
            ) : (
              <select
                value={form.category_id}
                onChange={(event) => updateField("category_id", event.target.value)}
                className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              placeholder="Add a product summary..."
            />
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          {!hidePrice ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-navy">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                placeholder="0.00"
                required
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Stock status</label>
            <select
              value={form.stock_status}
              onChange={(event) => updateField("stock_status", event.target.value)}
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
            >
              {STOCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-navy/10 bg-offwhite2 p-3 text-sm text-muted">
            <p className="font-medium text-navy">
              {lockIsCustom && isCustomValue
                ? "Gallery item"
                : "Ready-made product"}
            </p>
            <p className="mt-1">
              {lockIsCustom && isCustomValue
                ? "This item is locked as custom/gallery content."
                : "Custom/gallery items are managed separately."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-navy">Media</h2>
            <p className="text-sm text-muted">Manage the item gallery.</p>
          </div>

          {!productId ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Save the {entityLabel} first to enable uploads.
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-navy/15 bg-navy px-4 py-2 text-sm font-medium text-offwhite transition hover:bg-navy/90">
              {imageLoading ? "Uploading..." : "Upload image"}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleCloudinaryUpload(event.target.files?.[0])}
                className="hidden"
              />
            </label>
          )}
        </div>

        {mediaItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy/15 bg-offwhite2 px-4 py-8 text-center text-muted">
            No media uploaded yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mediaItems.map((media, index) => (
              <div
                key={media.id}
                className="overflow-hidden rounded-2xl border border-navy/10 bg-offwhite2"
              >
                <div className="relative">
                  <img
                    src={media.url}
                    alt="Product media"
                    className="h-40 w-full object-cover"
                  />
                  <div className="absolute right-2 top-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveMedia(index, -1)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs text-navy"
                      aria-label="Move media up"
                    >
                      â†‘
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMedia(index, 1)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs text-navy"
                      aria-label="Move media down"
                    >
                      â†“
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(media.id)}
                      className="rounded-md bg-red-500 px-2 py-1 text-xs text-white"
                      aria-label="Delete media"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(redirectPath)}
          className="rounded-xl border border-navy/15 bg-transparent px-4 py-2.5 text-sm font-medium text-navy"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || categoryLoading}
          className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-offwhite disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
```

### frontend/components/admin/StatusBadge.jsx
```
const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  in_stock: "bg-emerald-100 text-emerald-700",
  out_of_stock: "bg-red-100 text-red-700",
  made_to_order: "bg-violet-100 text-violet-700",
};

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();
  const className =
    STATUS_STYLES[normalizedStatus] || "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {normalizedStatus || "unknown"}
    </span>
  );
}
```

### frontend/components/admin/PaginationControls.jsx
```
export default function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
```

### frontend/components/admin/forms.js
```
export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function formatMoney(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

export function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
```

### frontend/app/admin/orders/page.js
```
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PaginationControls from "../../../components/admin/PaginationControls";
import StatusBadge from "../../../components/admin/StatusBadge";
import { formatDate, formatMoney } from "../../../components/admin/forms";
import { apiFetch } from "../../../lib/api";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function shortenId(id) {
  if (!id) return "-";
  return `${id.slice(0, 8)}...`;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState({ orders: [], page: 1, totalPages: 1, total: 0 });

  const selectedStatus = searchParams.get("status") || "all";
  const page = Number(searchParams.get("page") || "1");

  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", "10");
    if (selectedStatus !== "all") {
      query.set("status", selectedStatus);
    }
    return query.toString();
  }, [page, selectedStatus]);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const payload = await apiFetch(`/api/admin/orders?${queryString}`);
        if (!active) return;
        setResult(payload.data);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [queryString]);

  function updateQuery(nextStatus, nextPage) {
    const query = new URLSearchParams(searchParams.toString());

    if (nextStatus === "all") {
      query.delete("status");
    } else {
      query.set("status", nextStatus);
    }

    query.set("page", String(nextPage));
    router.push(`/admin/orders?${query.toString()}`);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Sales</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Orders</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = selectedStatus === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => updateQuery(filter.value, 1)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-navy bg-navy text-offwhite"
                  : "border-navy/15 bg-white text-navy hover:border-navy/30"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-navy/10 bg-white p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-offwhite2" />
          ))}
        </div>
      ) : result.orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-muted">
          {selectedStatus === "all"
            ? "No orders yet"
            : "No orders match this filter"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-offwhite2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {result.orders.map((order) => (
                  <tr key={order.id} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-navy hover:underline"
                      >
                        {shortenId(order.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.customer_name}</td>
                    <td className="px-4 py-3">{formatMoney(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationControls
        page={result.page || 1}
        totalPages={result.totalPages || 1}
        onPrevious={() => updateQuery(selectedStatus, Math.max(1, page - 1))}
        onNext={() =>
          updateQuery(selectedStatus, Math.min(result.totalPages || 1, page + 1))
        }
      />
    </div>
  );
}
```

### frontend/app/admin/orders/[id]/page.js
```
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "../../../../components/admin/StatusBadge";
import { formatDate, formatMoney } from "../../../../components/admin/forms";
import { apiFetch } from "../../../../lib/api";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadOrder() {
      setLoading(true);
      setError("");

      try {
        const payload = await apiFetch(`/api/admin/orders/${id}`);
        if (!active) return;
        setOrder(payload.data);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [id]);

  const latestTransaction = useMemo(() => order?.transactions?.[0] || null, [order]);

  async function handleStatusChange(nextStatus) {
    if (!order || nextStatus === order.status) return;

    setSaving(true);
    setError("");

    try {
      const payload = await apiFetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });

      setOrder((current) => ({
        ...current,
        status: payload.data.status,
      }));
    } catch (statusError) {
      setError(statusError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-navy/10 bg-white p-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-lg bg-offwhite2" />
        ))}
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-dashed border-navy/15 bg-white px-4 py-6 text-center text-muted">
        Order not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Sales</p>
          <h1 className="mt-2 font-display text-3xl text-navy">Order Detail</h1>
        </header>

        <Link href="/admin/orders" className="text-sm font-medium text-navy hover:underline">
          Back to Orders
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Customer</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Name</dt>
                <dd className="mt-1 text-sm text-ink">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Phone</dt>
                <dd className="mt-1 text-sm text-ink">{order.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Email</dt>
                <dd className="mt-1 text-sm text-ink">{order.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Order date</dt>
                <dd className="mt-1 text-sm text-ink">{formatDate(order.created_at)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Address</dt>
                <dd className="mt-1 text-sm text-ink">{order.address || "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Items</h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-navy/10 text-muted">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium">Qty</th>
                    <th className="pb-3 pr-4 font-medium">Unit Price</th>
                    <th className="pb-3 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.id} className="border-b border-navy/5 last:border-0">
                      <td className="py-3 pr-4">{item.product?.name || "Product"}</td>
                      <td className="py-3 pr-4">{item.quantity}</td>
                      <td className="py-3 pr-4">{formatMoney(item.unit_price)}</td>
                      <td className="py-3">{formatMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 border-t border-navy/10 pt-4 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Delivery fee</span>
                <span className="font-medium text-ink">{formatMoney(order.delivery_fee)}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-base">
                <span className="font-semibold text-navy">Total</span>
                <span className="font-semibold text-navy">{formatMoney(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Order Status</h2>
            <div className="mt-3">
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-navy">
                Update status
              </label>
              <select
                value={order.status}
                onChange={(event) => handleStatusChange(event.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-60"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {saving ? (
                <p className="mt-2 text-xs text-muted">Saving status...</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Payment</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Reference</dt>
                <dd className="mt-1 text-ink">
                  {latestTransaction?.paystack_reference || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Payment status</dt>
                <dd className="mt-1">
                  <StatusBadge status={latestTransaction?.status || "pending"} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Verified at</dt>
                <dd className="mt-1 text-ink">
                  {latestTransaction?.verified_at
                    ? formatDate(latestTransaction.verified_at)
                    : "Not verified yet"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### frontend/app/admin/gallery/page.js
```
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PaginationControls from "../../../components/admin/PaginationControls";
import StatusBadge from "../../../components/admin/StatusBadge";
import { apiFetch } from "../../../lib/api";

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const payload = await apiFetch("/api/categories");
        setCategories(payload.data || []);
      } catch (loadError) {
        console.error(loadError);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadGallery() {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        query.set("page", String(page));
        query.set("limit", "10");
        query.set("is_custom", "true");
        if (search.trim()) query.set("search", search.trim());
        if (selectedCategory !== "all") query.set("category", selectedCategory);

        const payload = await apiFetch(`/api/products?${query.toString()}`);
        if (!active) return;

        const products = payload?.data?.products || [];
        setItems(products);
        setTotalPages(payload?.data?.totalPages || 1);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGallery();

    return () => {
      active = false;
    };
  }, [page, search, selectedCategory]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, search]);

  async function handleDelete(itemId) {
    const confirmed = window.confirm("Delete this gallery item?");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/products/${itemId}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (deleteError) {
      setError(deleteError.message.replace(/^API error \(\d+\):\s*/, ""));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Showcase</p>
          <h1 className="mt-2 font-display text-3xl text-navy">Gallery</h1>
        </header>

        <Link
          href="/admin/gallery/new"
          className="inline-flex items-center justify-center rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-offwhite"
        >
          + Add Gallery Item
        </Link>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name"
            className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
          />

          <select
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-navy/10 bg-white p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-offwhite2" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-muted">
          No gallery items yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-offwhite2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-navy/10 bg-offwhite2">
                          {item.thumbnail?.url ? (
                            <img
                              src={item.thumbnail.url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                              IMG
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-navy">{item.name}</p>
                          <p className="text-xs text-muted">{item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.category?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.stock_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/gallery/${item.id}/edit`}
                          className="rounded-lg border border-navy/15 bg-white px-2.5 py-1.5 text-xs font-medium text-navy"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
      />
    </div>
  );
}
```

### frontend/app/admin/gallery/new/page.js
```
import ProductForm from "../../../../components/admin/ProductForm";

export default function NewGalleryItemPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Showcase</p>
        <h1 className="mt-2 font-display text-3xl text-navy">New Gallery Item</h1>
      </header>

      <ProductForm
        mode="create"
        hidePrice
        lockIsCustom
        isCustomValue
        redirectPath="/admin/gallery"
        entityLabel="gallery item"
      />
    </div>
  );
}
```

### frontend/app/admin/gallery/[id]/edit/page.js
```
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "../../../../../components/admin/ProductForm";
import { apiFetch } from "../../../../../lib/api";

export default function EditGalleryItemPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadItem() {
      try {
        const response = await apiFetch(`/api/admin/products/${id}`);
        if (!active) return;

        if (!response?.data) {
          setError("Gallery item not found.");
          return;
        }

        setItem(response.data);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-muted">
        Loading gallery item...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Showcase</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Edit Gallery Item</h1>
      </header>

      <ProductForm
        mode="edit"
        initialProduct={item}
        hidePrice
        lockIsCustom
        isCustomValue
        redirectPath="/admin/gallery"
        entityLabel="gallery item"
      />
    </div>
  );
}
```

### frontend/app/admin/categories/page.js
```
"use client";

import { useEffect, useState } from "react";
import { slugify } from "../../../components/admin/forms";
import { apiFetch } from "../../../lib/api";

function EditableRow({ category, onSave, onCancel }) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [slugTouched, setSlugTouched] = useState(true);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  return (
    <tr className="border-b border-navy/5 bg-offwhite2 last:border-0">
      <td className="px-4 py-3">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) {
              setSlug(slugify(event.target.value));
            }
          }}
          className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm outline-none"
        />
      </td>
      <td className="px-4 py-3">
        <input
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm outline-none"
        />
      </td>
      <td className="px-4 py-3 text-sm text-muted">{category._count?.products || 0}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave(category.id, { name, slug })}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    slugTouched: false,
  });

  useEffect(() => {
    if (!createForm.slugTouched) {
      setCreateForm((current) => ({
        ...current,
        slug: slugify(current.name),
      }));
    }
  }, [createForm.name, createForm.slugTouched]);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const payload = await apiFetch("/api/categories");
      setCategories(payload.data || []);
    } catch (loadError) {
      setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function createCategory(event) {
    event.preventDefault();
    if (!createForm.name.trim() || !createForm.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name.trim(),
          slug: createForm.slug.trim(),
        }),
      });

      setCategories((current) => [...current, payload.data].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateForm({ name: "", slug: "", slugTouched: false });
    } catch (saveError) {
      setError(saveError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(categoryId, values) {
    if (!values.name.trim() || !values.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = await apiFetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: values.name.trim(),
          slug: values.slug.trim(),
        }),
      });

      setCategories((current) =>
        current
          .map((category) =>
            category.id === categoryId ? payload.data : category,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId("");
    } catch (updateError) {
      setError(updateError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    const hasProducts = (category._count?.products || 0) > 0;
    const warning = hasProducts
      ? "This category has linked products and cannot be deleted yet. Continue to confirm backend behavior?"
      : "Delete this category?";

    const confirmed = window.confirm(warning);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await apiFetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
    } catch (deleteError) {
      setError(deleteError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Catalog</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Categories</h1>
      </header>

      <form
        onSubmit={createCategory}
        className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={createForm.name}
          onChange={(event) =>
            setCreateForm((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Category name"
          className="rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
        />
        <input
          value={createForm.slug}
          onChange={(event) =>
            setCreateForm((current) => ({
              ...current,
              slugTouched: true,
              slug: event.target.value,
            }))
          }
          placeholder="category-slug"
          className="rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-navy px-4 py-3 text-sm font-medium text-offwhite disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add Category"}
        </button>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-navy/10 bg-white p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-offwhite2" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-muted">
          No categories yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-offwhite2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) =>
                  editingId === category.id ? (
                    <EditableRow
                      key={category.id}
                      category={category}
                      onSave={updateCategory}
                      onCancel={() => setEditingId("")}
                    />
                  ) : (
                    <tr key={category.id} className="border-b border-navy/5 last:border-0">
                      <td className="px-4 py-3 font-medium text-navy">{category.name}</td>
                      <td className="px-4 py-3 text-muted">{category.slug}</td>
                      <td className="px-4 py-3 text-muted">{category._count?.products || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(category.id)}
                            className="rounded-lg border border-navy/15 bg-white px-2.5 py-1.5 text-xs font-medium text-navy"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(category)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

### frontend/app/admin/products/new/page.js
```
import ProductForm from "../../../../components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Catalog</p>
        <h1 className="mt-2 font-display text-3xl text-navy">New Product</h1>
      </header>

      <ProductForm mode="create" />
    </div>
  );
}
```

### frontend/app/admin/products/[id]/edit/page.js
```
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "../../../../../components/admin/ProductForm";
import { apiFetch } from "../../../../../lib/api";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    async function loadProduct() {
      try {
        const response = await apiFetch(`/api/admin/products/${id}`);
        const foundProduct = response?.data;

        if (!active) {
          return;
        }

        if (!foundProduct) {
          setError("Product not found.");
          return;
        }

        setProduct(foundProduct);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-muted">
        Loading product...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Catalog</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Edit Product</h1>
      </header>

      <ProductForm mode="edit" initialProduct={product} />
    </div>
  );
}
```
