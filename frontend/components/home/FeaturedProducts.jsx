"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import Section from "../ui/Section";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { apiFetch } from "../../lib/api";

function normalizeProducts(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data?.products)) {
    return payload.data.products;
  }

  if (Array.isArray(payload?.products)) {
    return payload.products;
  }

  return [];
}

function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "GHS --";
  }

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(amount);
}

function ProductSkeleton() {
  return (
    <div className="min-w-[78%] snap-start md:min-w-0">
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="h-44 animate-pulse rounded-xl bg-offwhite" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-offwhite" />
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-offwhite" />
      </div>
    </div>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const payload = await apiFetch("/api/products?limit=6");
        if (!isMounted) {
          return;
        }
        setProducts(normalizeProducts(payload));
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err?.message || "Unable to load featured products right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasProducts = useMemo(() => products.length > 0, [products]);

  return (
    <Section background="offwhite2">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl text-navy sm:text-4xl">
          Featured Products
        </h2>
        <Button
          href="/shop"
          variant="outline"
          className="hidden sm:inline-flex"
        >
          View All
        </Button>
      </div>

      {isLoading && (
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      )}

      {!isLoading && !hasProducts && (
        <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-8 text-center">
          <h3 className="font-display text-2xl text-navy">No products yet</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
            Your featured catalog will appear here once products are added in
            the admin.
          </p>
          <div className="mt-6">
            <Button href="/shop" variant="secondary" size="lg">
              View All
            </Button>
          </div>
          {error && <p className="mt-4 text-xs text-muted">{error}</p>}
        </div>
      )}

      {!isLoading && hasProducts && (
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
          {products.map((product) => {
            const thumbnailUrl = product?.thumbnail?.url;
            const productHref = `/shop/${product?.slug || product?.id}`;

            return (
              <Link
                key={product.id || product.slug}
                href={productHref}
                className="min-w-[78%] snap-start rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite2 md:min-w-0"
              >
                <Card className="h-full p-4">
                  {thumbnailUrl ? (
                    <div className="relative h-44 overflow-hidden rounded-xl bg-offwhite">
                      <Image
                        src={thumbnailUrl}
                        alt={product.name || "Product image"}
                        fill
                        sizes="(max-width: 768px) 80vw, (max-width: 1024px) 45vw, 30vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-navy/20 bg-offwhite2 text-muted">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <ImageIcon className="h-6 w-6" aria-hidden="true" />
                        <span className="text-xs">Image coming soon</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <h3 className="line-clamp-2 font-display text-xl text-navy">
                      {product?.name || "Untitled Product"}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {formatPrice(product?.price)}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 sm:hidden">
        <Button href="/shop" variant="outline" className="w-full">
          View All
        </Button>
      </div>
    </Section>
  );
}
