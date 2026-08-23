"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useCart } from "../../lib/cartContext";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../lib/cloudinaryImage";
import Section from "../../components/ui/Section";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function validateForm(form) {
  if (!form.customer_name.trim()) {
    return "Full name is required.";
  }

  if (!form.phone.trim()) {
    return "Phone number is required.";
  }

  if (!form.email.trim()) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Enter a valid email address.";
  }

  if (!form.address.trim()) {
    return "Delivery address is required.";
  }

  return "";
}

const initialForm = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
};
const CHECKOUT_IDEMPOTENCY_KEY_STORAGE = "qcd_checkout_idempotency_key";
const CHECKOUT_IDEMPOTENCY_FINGERPRINT_STORAGE =
  "qcd_checkout_idempotency_fingerprint";

function getOrderFingerprint(orderItems) {
  return JSON.stringify(
    orderItems.map((item) => [item.product_id, item.quantity]),
  );
}

function createIdempotencyKey() {
  if (
    typeof window !== "undefined" &&
    typeof window.crypto?.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `qcd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function CheckoutPage() {
  const { items, subtotal, totalItemCount, isHydrated } = useCart();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const orderItems = useMemo(
    () =>
      items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    [items],
  );
  const orderFingerprint = useMemo(
    () => getOrderFingerprint(orderItems),
    [orderItems],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (items.length === 0) {
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY_STORAGE);
      window.sessionStorage.removeItem(
        CHECKOUT_IDEMPOTENCY_FINGERPRINT_STORAGE,
      );
      setIdempotencyKey("");
      return;
    }

    const storedKey = window.sessionStorage.getItem(
      CHECKOUT_IDEMPOTENCY_KEY_STORAGE,
    );
    const storedFingerprint = window.sessionStorage.getItem(
      CHECKOUT_IDEMPOTENCY_FINGERPRINT_STORAGE,
    );

    if (storedKey && storedFingerprint === orderFingerprint) {
      setIdempotencyKey(storedKey);
      return;
    }

    const nextKey = createIdempotencyKey();
    window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_KEY_STORAGE, nextKey);
    window.sessionStorage.setItem(
      CHECKOUT_IDEMPOTENCY_FINGERPRINT_STORAGE,
      orderFingerprint,
    );
    setIdempotencyKey(nextKey);
  }, [isHydrated, items.length, orderFingerprint]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty. Add an item before checkout.");
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const requestIdempotencyKey = idempotencyKey || createIdempotencyKey();
      if (!idempotencyKey) {
        window.sessionStorage.setItem(
          CHECKOUT_IDEMPOTENCY_KEY_STORAGE,
          requestIdempotencyKey,
        );
        window.sessionStorage.setItem(
          CHECKOUT_IDEMPOTENCY_FINGERPRINT_STORAGE,
          orderFingerprint,
        );
        setIdempotencyKey(requestIdempotencyKey);
      }

      const response = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          items: orderItems,
          idempotency_key: requestIdempotencyKey,
        }),
      });

      const authorizationUrl = response?.data?.authorization_url;
      if (!authorizationUrl) {
        throw new Error("Unable to initialize payment right now.");
      }

      window.location.href = authorizationUrl;
    } catch (requestError) {
      setError(requestError?.message || "Unable to start checkout right now.");
      setIsSubmitting(false);
    }
  }

  if (!isHydrated) {
    return (
      <Section background="offwhite2">
        <Container>
          <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        </Container>
      </Section>
    );
  }

  if (items.length === 0) {
    return (
      <Section background="offwhite2">
        <Container>
          <div className="rounded-3xl border border-navy/10 bg-white p-10 text-center shadow-sm">
            <ShoppingBag
              className="mx-auto h-10 w-10 text-muted"
              aria-hidden="true"
            />
            <h1 className="mt-4 font-display text-4xl text-navy">
              Your cart is empty
            </h1>
            <p className="mt-2 text-sm text-muted">
              Add products to your cart before starting checkout.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/shop" variant="secondary">
                Continue Shopping
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section background="offwhite2">
      <Container>
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-display text-4xl text-navy sm:text-5xl">
              Checkout
            </h1>
            <p className="text-sm text-muted sm:text-base">
              Complete your details to proceed to secure payment.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-ink">
                    Full Name
                  </span>
                  <input
                    type="text"
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink">Phone</span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. 024 000 0000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-ink">
                    Delivery Address
                  </span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, area, landmarks"
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                  />
                </label>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="min-w-56 justify-center"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Redirecting to payment...
                    </span>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>

                <Link
                  href="/shop"
                  className="text-sm font-medium text-navy hover:underline"
                >
                  Continue shopping
                </Link>
              </div>
            </form>

            <aside className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-navy">
                  Order Summary
                </h2>
                <p className="text-sm text-muted">{totalItemCount} item(s)</p>
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 rounded-2xl border border-black/5 bg-offwhite2 p-3"
                  >
                    <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-slate-100">
                      {item.image ? (
                        <Image
                          src={cloudinaryImageUrl(item.image, {
                            width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                          })}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-ink">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Qty: {item.quantity}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-black/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-ink">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Delivery</span>
                  <span className="font-medium text-ink">
                    Calculated by backend
                  </span>
                </div>
                <p className="pt-1 text-xs text-muted">
                  You will be redirected to Paystack to complete payment
                  securely.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </Section>
  );
}
