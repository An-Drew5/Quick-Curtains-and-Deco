const PAYSTACK_API_BASE = "https://api.paystack.co";
const PAYSTACK_MINOR_UNIT_MULTIPLIER = 100;

function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || typeof key !== "string" || key.trim() === "") {
    const error = new Error("PAYSTACK_SECRET_KEY is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return key;
}

function getDeliveryFlatFee() {
  const raw = process.env.DELIVERY_FLAT_FEE ?? "0";
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error(
      "DELIVERY_FLAT_FEE must be a valid non-negative number in base currency units.",
    );
    error.statusCode = 500;
    throw error;
  }

  return parsed;
}

function toMinorUnit(amountInBaseUnits) {
  return Math.round(Number(amountInBaseUnits) * PAYSTACK_MINOR_UNIT_MULTIPLIER);
}

async function initializePaystackTransaction({ email, amountMinorUnit, metadata }) {
  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountMinorUnit,
      metadata,
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.status) {
    const message = payload?.message || "Failed to initialize Paystack payment.";
    const error = new Error(message);
    error.statusCode = 502;
    throw error;
  }

  return payload.data;
}

async function verifyPaystackTransaction(reference) {
  const response = await fetch(
    `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
      },
    },
  );

  const payload = await response.json();

  if (!response.ok || !payload?.status) {
    const message = payload?.message || "Failed to verify Paystack transaction.";
    const error = new Error(message);
    error.statusCode = 502;
    throw error;
  }

  return payload.data;
}

export {
  PAYSTACK_MINOR_UNIT_MULTIPLIER,
  getDeliveryFlatFee,
  toMinorUnit,
  initializePaystackTransaction,
  verifyPaystackTransaction,
  getPaystackSecretKey,
};
