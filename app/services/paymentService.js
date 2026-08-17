import prisma from "../lib/prisma.js";

async function applyTransactionPaymentResult({ reference, status, source }) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (!["success", "failed"].includes(normalizedStatus)) {
    const error = new Error("Invalid payment status supplied.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.transaction.findUnique({
    where: { paystack_reference: reference },
  });

  if (!existing) {
    return { transaction: null, order: null };
  }

  if (existing.status === "success" && normalizedStatus === "failed") {
    const order = await prisma.order.findUnique({ where: { id: existing.order_id } });
    return { transaction: existing, order };
  }

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.update({
      where: { paystack_reference: reference },
      data:
        normalizedStatus === "success"
          ? {
              status: "success",
              verified_at: new Date(),
            }
          : {
              status: "failed",
            },
    });

    const order = await tx.order.update({
      where: { id: transaction.order_id },
      data: {
        status: normalizedStatus === "success" ? "paid" : "payment_failed",
      },
    });

    return { transaction, order };
  });

  console.log(
    `[payment-update] source=${source} reference=${reference} status=${normalizedStatus}`,
  );

  return result;
}

export { applyTransactionPaymentResult };
