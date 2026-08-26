"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, PackageSearch } from "lucide-react";
import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { apiFetch } from "../../lib/api";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../lib/cloudinaryImage";
import useLikes from "../../lib/useLikes";

function GallerySkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="aspect-[4/5] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

function firstImage(item) {
  return item?.thumbnail?.url || null;
}

export default function CustomGalleryPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const { isLiked, toggleLike } = useLikes();

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await apiFetch("/api/categories");
        if (!active) return;
        setCategories(Array.isArray(response?.data) ? response.data : []);
      } catch (_error) {
        if (!active) return;
        setCategories([]);
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadGalleryItems() {
      try {
        setLoading(true);
        setError("");

        const query = new URLSearchParams();
        query.set("is_custom", "true");
        query.set("page", "1");
        query.set("limit", "48");
        if (selectedCategory) {
          query.set("category", selectedCategory);
        }

        const response = await apiFetch(`/api/products?${query.toString()}`);
        if (!active) return;

        const products = Array.isArray(response?.data?.products)
          ? response.data.products
          : [];

        setItems(products);
      } catch (_error) {
        if (!active) return;
        setError("Unable to load gallery items right now.");
        setItems([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGalleryItems();

    return () => {
      active = false;
    };
  }, [selectedCategory]);

  const categoriesWithAll = useMemo(
    () => [{ id: "all", name: "All", slug: "" }, ...categories],
    [categories],
  );

  return (
    <Section background="offwhite2" className="py-12 sm:py-14 lg:py-16">
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
            Custom Gallery
          </p>
          <h1 className="font-display text-4xl text-navy sm:text-5xl">
            Explore our custom designs and find inspiration for your space
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            Browse one-of-a-kind curtain concepts tailored for different rooms,
            moods, and finishes.
          </p>
        </header>

        <div className="space-y-3 border-y border-navy/15 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Filter by category
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {categoriesLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 min-w-24 animate-pulse rounded-full bg-slate-200"
                  />
                ))
              : categoriesWithAll.map((category) => {
                  const active = category.slug === selectedCategory;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
                        active
                          ? "border-navy bg-navy text-offwhite"
                          : "border-navy/20 bg-transparent text-ink hover:border-navy hover:text-navy"
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <GallerySkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center shadow-sm">
            <p className="font-display text-2xl text-navy">
              Something went wrong
            </p>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-10 text-center shadow-sm">
            <PackageSearch
              className="mx-auto h-10 w-10 text-muted"
              aria-hidden="true"
            />
            <h2 className="mt-4 font-display text-2xl text-navy">
              No gallery items yet
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
              We are adding more custom inspiration soon. Try another category
              or check back shortly.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/custom-gallery" variant="secondary">
                View All Categories
              </Button>
            </div>
          </div>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
            {items.map((item, index) => {
              const imageUrl = firstImage(item);
              const liked = isLiked(item.id);

              return (
                <motion.div
                  key={item.id}
                  className="mb-4 break-inside-avoid"
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.03,
                    ease: "easeOut",
                  }}
                >
                  <Link
                    href={`/custom-gallery/${item.slug}`}
                    className="gallery-card group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite2"
                  >
                    <Card className="relative overflow-hidden p-0">
                      <div className="relative max-h-[38rem] overflow-hidden bg-slate-100">
                        {imageUrl ? (
                          <img
                            src={cloudinaryImageUrl(imageUrl, {
                              width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                            })}
                            alt={item.name}
                            className="block h-auto max-h-[38rem] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <span className="text-xs font-medium text-muted">
                              Image coming soon
                            </span>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-beige">
                            {item.category?.name || "Uncategorized"}
                          </p>
                          <p className="mt-1 font-display text-xl leading-tight text-offwhite">
                            {item.name}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          aria-label={
                            liked ? `Unlike ${item.name}` : `Like ${item.name}`
                          }
                          aria-pressed={liked}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleLike(item.id);
                          }}
                          animate={{ scale: liked ? [1, 1.22, 1] : 1 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className={`like-button absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${liked ? "text-red-600" : "text-navy"}`}
                        >
                          <Heart
                            className="h-5 w-5"
                            fill={liked ? "currentColor" : "none"}
                            strokeWidth={liked ? 2.5 : 1.8}
                          />
                        </motion.button>
                      </div>

                      <div className="space-y-2 p-4 group-hover:bg-white">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          {item.category?.name || "Uncategorized"}
                        </p>
                        <h2 className="line-clamp-2 font-display text-lg leading-tight text-navy">
                          {item.name}
                        </h2>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <style jsx>{`
        @media (hover: hover) and (pointer: fine) {
          .like-button {
            opacity: 0;
          }

          .gallery-card:hover .like-button,
          .gallery-card:focus-within .like-button {
            opacity: 1;
          }
        }
      `}</style>
    </Section>
  );
}
