"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../../lib/cartContext";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../lib/cloudinaryImage";
import Button from "../ui/Button";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

export default function CartDrawer({ isOpen, onClose }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart drawer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col bg-offwhite shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
              <div>
                <p className="font-display text-2xl text-navy">Your Cart</p>
                <p className="text-sm text-muted">{items.length} item(s)</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy/20 text-navy transition hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <ShoppingBag
                  className="h-11 w-11 text-muted"
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-display text-2xl text-navy">
                  Your cart is empty
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Add products to your cart and they will appear here.
                </p>
                <Button
                  href="/shop"
                  variant="secondary"
                  size="lg"
                  className="mt-6"
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-slate-100">
                          {item.image ? (
                            <Image
                              src={cloudinaryImageUrl(item.image, {
                                width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                              })}
                              alt={item.name}
                              fill
                              unoptimized
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/shop/${item.slug}`}
                            onClick={onClose}
                            className="line-clamp-2 font-display text-lg leading-tight text-navy hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm font-semibold text-ink">
                            {formatPrice(item.price)}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    Math.max(1, item.quantity - 1),
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-ink transition hover:border-navy hover:text-navy"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold text-ink">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1,
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-ink transition hover:border-navy hover:text-navy"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-muted transition hover:border-red-300 hover:text-red-600"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-navy/10 bg-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted">Subtotal</p>
                    <p className="text-lg font-semibold text-ink">
                      {formatPrice(subtotal)}
                    </p>
                  </div>
                  <p className="text-xs text-muted">
                    Delivery fee calculated at checkout
                  </p>

                  <Button
                    href="/checkout"
                    size="lg"
                    variant="primary"
                    className="w-full justify-center"
                    onClick={onClose}
                  >
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
