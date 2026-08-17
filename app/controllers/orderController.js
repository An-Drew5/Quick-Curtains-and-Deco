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
      return { error: "Each item must be an object with product_id and quantity." };
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

export async function createOrderAndInitializePayment(req, res, next) {
  try {
    const { customer_name, phone, email, address, items } = req.body;

    const fieldErrors = [
      validateNonEmpty(customer_name, "customer_name"),
      validateNonEmpty(phone, "phone"),
      validateNonEmpty(email, "email"),
      validateNonEmpty(address, "address"),
    ].filter(Boolean);

    if (fieldErrors.length > 0) {
      return res.status(400).json({ success: false, error: fieldErrors.join(" ") });
    }

    const { error: itemsError, quantitiesByProductId } = mapAndValidateItems(items);
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

    const productById = new Map(products.map((product) => [product.id, product]));

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

    const paystackInit = await initializePaystackTransaction({
      email: email.trim(),
      amountMinorUnit,
      metadata: {
        order_id: createdOrder.id,
      },
    });

    await prisma.transaction.create({
      data: {
        order_id: createdOrder.id,
        paystack_reference: paystackInit.reference,
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
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}
