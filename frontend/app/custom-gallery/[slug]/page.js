"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronRight, House, MessageCircle } from "lucide-react";
import Section from "../../../components/ui/Section";
import Container from "../../../components/ui/Container";
import Button from "../../../components/ui/Button";
import { apiFetch } from "../../../lib/api";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../../lib/cloudinaryImage";

function getProductMedia(product) {
  return Array.isArray(product?.media) ? product.media : [];
}

function buildWhatsAppUrl(itemName) {
  const phoneNumber = "PLACEHOLDER_NUMBER";
  const message = `Hi, I'm interested in ${itemName} from your custom gallery`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function CustomGalleryDetailPage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      try {
        setIsLoading(true);
        setNotFound(false);
        setError("");

        const response = await apiFetch(`/api/products/${slug}`);
        if (!isMounted) {
          return;
        }

        const loadedItem = response?.data || null;
        if (!loadedItem || !loadedItem.is_custom) {
          setNotFound(true);
          setItem(null);
          return;
        }

        setItem(loadedItem);
        setActiveIndex(0);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError("Unable to load this gallery item right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (slug) {
      loadItem();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const media = useMemo(() => getProductMedia(item), [item]);
  const activeMedia = media[activeIndex] || media[0];

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
            <h1 className="font-display text-4xl text-navy">Item not found</h1>
            <p className="mt-3 text-sm text-muted">
              The custom gallery item you are looking for may have moved or the link is incorrect.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/custom-gallery" variant="primary">
                Back to Custom Gallery
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (error || !item) {
    return (
      <Section background="offwhite2">
        <Container>
          <div className="rounded-3xl border border-navy/10 bg-white p-10 text-center shadow-sm">
            <h1 className="font-display text-4xl text-navy">Unable to load item</h1>
            <p className="mt-3 text-sm text-muted">
              {error || "Please try again in a moment."}
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/custom-gallery" variant="primary">
                Back to Custom Gallery
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
            <Link href="/custom-gallery" className="hover:text-navy">
              Custom Gallery
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-ink">{item.category?.name || "Category"}</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-ink">{item.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
                {activeMedia?.url ? (
                  <Image
                    src={cloudinaryImageUrl(activeMedia.url, {
                      width: CLOUDINARY_IMAGE_WIDTHS.detail,
                    })}
                    alt={item.name}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                    No image
                  </div>
                )}
              </div>

              {media.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-wrap">
                  {media.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-20 w-20 flex-none overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
                        index === activeIndex ? "border-navy" : "border-transparent"
                      }`}
                    >
                      <Image
                        src={cloudinaryImageUrl(image.url, {
                          width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                        })}
                        alt={`${item.name} thumbnail ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6 rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-3">
                <Link
                  href={`/custom-gallery?category=${item.category?.slug || ""}`}
                  className="text-sm font-medium text-muted hover:text-navy"
                >
                  {item.category?.name || "Category"}
                </Link>
                <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">
                  {item.name}
                </h1>
              </div>

              <p className="text-sm leading-relaxed text-muted sm:text-base">
                {item.description || "No description available yet for this custom design."}
              </p>

              <div className="space-y-3">
                <Button
                  href={buildWhatsAppUrl(item.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="primary"
                  className="w-full justify-center"
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Enquire on WhatsApp
                  </span>
                </Button>
                <Button
                  href="/contact"
                  size="lg"
                  variant="outline"
                  className="w-full justify-center"
                >
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}