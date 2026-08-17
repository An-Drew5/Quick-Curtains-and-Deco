"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronRight, House, ShoppingCart, Minus, Plus } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { useCart } from "../../../lib/cartContext";
import Section from "../../../components/ui/Section";
import Container from "../../../components/ui/Container";
import Button from "../../../components/ui/Button";

function formatPrice(price) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));
}

function getProductMedia(product) {
  return Array.isArray(product?.media) ? product.media : [];
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setIsLoading(true);
        setNotFound(false);
        setError("");

        const response = await apiFetch(`/api/products/${slug}`);
        if (!isMounted) {
          return;
        }

        setProduct(response?.data || null);
        setQuantity(1);
        setActiveIndex(0);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError("Unable to load this product right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (slug) {
      loadProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const media = useMemo(() => getProductMedia(product), [product]);
  const activeMedia = media[activeIndex] || media[0];
  const inStock = product?.stock_status === "in_stock";

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = setTimeout(() => setToastMessage(""), 2400);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  function showToast(message) {
    setToastMessage(message);
  }

  function handleAddToCart() {
    if (!product || !inStock) {
      return;
    }

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: activeMedia?.url || media[0]?.url || "",
      },
      quantity,
    );
    showToast(`Added ${quantity} item${quantity > 1 ? "s" : ""} to cart`);
  }

  function handleThumbSelect(index) {
    setActiveIndex(index);
  }

  if (isLoading) {
    return (
      <Section background="offwhite2">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
              <div className="flex gap-3 overflow-x-auto">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 w-20 animate-pulse rounded-xl bg-slate-200"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-1/4 animate-pulse rounded bg-slate-200" />
              <div className="h-24 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (notFound) {
    return (
      <Section background="offwhite2">
        <Container>
          <div className="rounded-3xl border border-navy/10 bg-white p-10 text-center shadow-sm">
            <h1 className="font-display text-4xl text-navy">
              Product not found
            </h1>
            <p className="mt-3 text-sm text-muted">
              The item you’re looking for may have been removed or the link is
              incorrect.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/shop" variant="primary">
                Back to Shop
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (error || !product) {
    return (
      <Section background="offwhite2">
        <Container>
          <div className="rounded-3xl border border-navy/10 bg-white p-10 text-center shadow-sm">
            <h1 className="font-display text-4xl text-navy">
              Unable to load product
            </h1>
            <p className="mt-3 text-sm text-muted">
              {error || "Please try again in a moment."}
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/shop" variant="primary">
                Back to Shop
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
        <div className="space-y-6">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-muted"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-navy"
            >
              <House className="h-4 w-4" aria-hidden="true" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link href="/shop" className="hover:text-navy">
              Shop
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link
              href={`/shop?category=${product.category?.slug || ""}`}
              className="hover:text-navy"
            >
              {product.category?.name || "Category"}
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-ink">{product.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
                {activeMedia?.url ? (
                  <Image
                    src={activeMedia.url}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                    No image
                  </div>
                )}
              </div>

              {media.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-wrap">
                  {media.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleThumbSelect(index)}
                      className={`relative h-20 w-20 flex-none overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
                        index === activeIndex
                          ? "border-navy"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={item.url}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6 rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-3">
                <Link
                  href={`/shop?category=${product.category?.slug || ""}`}
                  className="text-sm font-medium text-muted hover:text-navy"
                >
                  {product.category?.name || "Category"}
                </Link>
                <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">
                  {product.name}
                </h1>
                <p className="text-2xl font-semibold text-ink">
                  {formatPrice(product.price)}
                </p>
                <p
                  className={`text-sm font-semibold ${inStock ? "text-emerald-600" : "text-amber-700"}`}
                >
                  {inStock ? "In Stock" : "Out of Stock"}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-muted sm:text-base">
                {product.description || "No description available."}
              </p>

              <div className="space-y-3">
                <p className="text-sm font-medium text-ink">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    disabled={!inStock}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-ink transition hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="min-w-10 text-center text-lg font-semibold text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => current + 1)}
                    disabled={!inStock}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-ink transition hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="primary"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                  className="w-full justify-center"
                >
                  {inStock ? (
                    <span className="inline-flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      Add to Cart
                    </span>
                  ) : (
                    "Out of Stock"
                  )}
                </Button>

                {toastMessage && (
                  <div className="rounded-full bg-navy px-4 py-2 text-center text-sm font-medium text-offwhite shadow-lg">
                    {toastMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
