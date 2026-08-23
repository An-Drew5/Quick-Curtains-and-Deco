"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Section from "../ui/Section";
import Button from "../ui/Button";
import { apiFetch } from "../../lib/api";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../lib/cloudinaryImage";

function getThumbnailUrl(item) {
  return item?.thumbnail?.url || null;
}

export default function CustomGalleryTeaser() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadGalleryPreview() {
      try {
        const response = await apiFetch("/api/products?is_custom=true&limit=4&page=1");
        if (!active) {
          return;
        }

        const products = Array.isArray(response?.data?.products)
          ? response.data.products
          : [];
        setItems(products.slice(0, 4));
      } catch (_error) {
        if (!active) {
          return;
        }
        setItems([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGalleryPreview();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Section background="navy">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <h2 className="font-display text-3xl text-offwhite sm:text-4xl">
            Crafted for Your Exact Style
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-offwhite/80 sm:text-base">
            Explore how our custom team blends fabric, lining, and finish
            details to create statement curtains made specifically for your
            room.
          </p>
          <Button href="/custom-gallery" size="lg" variant="secondary">
            Explore Custom Gallery
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {(loading ? Array.from({ length: 4 }) : items).map((item, index) => {
            const imageUrl = getThumbnailUrl(item);

            return (
              <div
                key={item?.id || `skeleton-${index}`}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-offwhite/25 bg-slate-200"
              >
                {loading ? (
                  <div className="h-full w-full animate-pulse bg-slate-300/70" />
                ) : imageUrl ? (
                  <Image
                    src={cloudinaryImageUrl(imageUrl, {
                      width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                    })}
                    alt={item.name || "Custom gallery preview"}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 18vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-navy via-[#243654] to-[#31476d]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
