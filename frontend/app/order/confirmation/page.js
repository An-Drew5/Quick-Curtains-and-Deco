"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { useCart } from "../../../lib/cartContext";
import Section from "../../../components/ui/Section";
import Container from "../../../components/ui/Container";
import Button from "../../../components/ui/Button";

const CHECKOUT_IDEMPOTENCY_KEY_STORAGE = "qcd_checkout_idempotency_key";
const CHECKOUT_IDEMPOTENCY_FINGERPRINT_STORAGE =
  "qcd_checkout_idempotency_fingerprint";

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const reference = useMemo(
    () => searchParams.get("reference") || "",
    [searchParams],
  );
  const { clearCart } = useCart();
  const cartClearedRef = useRef(false);

  const [state, setState] = useState({
    kind: "loading",
    message: "Verifying your payment...",
    transactionStatus: "",
    orderStatus: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!reference) {
        if (isMounted) {
          setState({
            kind: "missing",
            message: "No payment reference found in the URL.",
            transactionStatus: "",
            orderStatus: "",
          });
        }
        return;
      }

      if (isMounted) {
        setState({
          kind: "loading",
          message: "Verifying your payment...",
          transactionStatus: "",
          orderStatus: "",
        });
      }

      try {
        const response = await apiFetch(
          `/api/orders/verify/${encodeURIComponent(reference)}`,
        );

        if (!isMounted) {
          return;
        }

        const transactionStatus = normalizeStatus(
          response?.data?.transaction_status,
        );
        const orderStatus = normalizeStatus(response?.data?.order_status);

        if (transactionStatus === "success") {
          if (!cartClearedRef.current) {
            clearCart();
            window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY_STORAGE);
            window.sessionStorage.removeItem(
              CHECKOUT_IDEMPOTENCY_FINGERPRINT_STORAGE,
            );
            cartClearedRef.current = true;
          }

          setState({
            kind: "success",
            message: "Payment successful. Your order has been confirmed.",
            transactionStatus,
            orderStatus,
          });
          return;
        }

        if (["failed", "abandoned", "reversed"].includes(transactionStatus)) {
          setState({
            kind: "failed",
            message:
              "Payment was not completed. Your cart is still available so you can try again.",
            transactionStatus,
            orderStatus,
          });
          return;
        }

        setState({
          kind: "pending",
          message:
            "Payment is still processing. Please check again shortly using this reference.",
          transactionStatus,
          orderStatus,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          kind: "error",
          message:
            error?.message ||
            "We could not verify this payment right now. Please retry.",
          transactionStatus: "",
          orderStatus: "",
        });
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [reference, clearCart]);

  return (
    <Section background="offwhite2">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-black/5 bg-white p-8 shadow-sm sm:p-10">
          <StatusHeader kind={state.kind} />

          <h1 className="mt-5 font-display text-4xl text-navy sm:text-5xl">
            {getTitle(state.kind)}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {state.message}
          </p>

          <div className="mt-6 space-y-2 rounded-2xl bg-offwhite2 p-4 text-sm text-ink">
            <p>
              <span className="font-semibold">Reference:</span>{" "}
              {reference || "N/A"}
            </p>
            {state.transactionStatus ? (
              <p>
                <span className="font-semibold">Transaction status:</span>{" "}
                {state.transactionStatus}
              </p>
            ) : null}
            {state.orderStatus ? (
              <p>
                <span className="font-semibold">Order status:</span>{" "}
                {state.orderStatus}
              </p>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {state.kind === "success" ? (
              <>
                <Button href="/shop" variant="secondary">
                  Continue Shopping
                </Button>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-navy hover:underline"
                >
                  Need help? Contact support
                </Link>
              </>
            ) : state.kind === "loading" ? null : (
              <>
                <Button href="/checkout" variant="primary">
                  Return to Checkout
                </Button>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-navy hover:underline"
                >
                  Need help? Contact support
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <Section background="offwhite2">
          <Container>
            <div className="mx-auto max-w-3xl rounded-3xl border border-black/5 bg-white p-8 shadow-sm sm:p-10">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-navy">
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              </div>
              <h1 className="mt-5 font-display text-4xl text-navy sm:text-5xl">
                Verifying Payment
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Verifying your payment...
              </p>
            </div>
          </Container>
        </Section>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

function StatusHeader({ kind }) {
  if (kind === "loading") {
    return (
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-navy">
        <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (kind === "success") {
    return (
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
      </div>
    );
  }

  if (kind === "pending") {
    return (
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Clock3 className="h-7 w-7" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
      <AlertCircle className="h-7 w-7" aria-hidden="true" />
    </div>
  );
}

function getTitle(kind) {
  switch (kind) {
    case "success":
      return "Order Confirmed";
    case "pending":
      return "Payment Pending";
    case "failed":
      return "Payment Failed";
    case "missing":
      return "Reference Missing";
    case "error":
      return "Verification Error";
    default:
      return "Verifying Payment";
  }
}
