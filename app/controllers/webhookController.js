import crypto from "crypto";
import { getPaystackSecretKey } from "../lib/paystack.js";
import { applyTransactionPaymentResult } from "../services/paymentService.js";

const PAYSTACK_FAILURE_EVENTS = new Set([
  "charge.failed",
  "charge.abandoned",
  "charge.reversed",
]);

function safeSignatureMatch(expectedHex, signatureHeader) {
  if (!signatureHeader) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(String(signatureHeader), "hex");

  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, provided);
}

export async function handlePaystackWebhook(req, res, next) {
  try {
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).json({ success: false, error: "Invalid raw body." });
    }

    const signature = req.headers["x-paystack-signature"];

    const computedSignature = crypto
      .createHmac("sha512", getPaystackSecretKey())
      .update(rawBody)
      .digest("hex");

    if (!safeSignatureMatch(computedSignature, signature)) {
      return res.status(401).json({ success: false, error: "Invalid webhook signature." });
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const event = String(payload?.event || "");
    const reference = payload?.data?.reference || null;

    console.log(`[paystack-webhook] event=${event} reference=${reference || "n/a"}`);

    if (reference && event === "charge.success") {
      await applyTransactionPaymentResult({
        reference,
        status: "success",
        source: "webhook",
      });
    } else if (reference && PAYSTACK_FAILURE_EVENTS.has(event)) {
      await applyTransactionPaymentResult({
        reference,
        status: "failed",
        source: "webhook",
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}
