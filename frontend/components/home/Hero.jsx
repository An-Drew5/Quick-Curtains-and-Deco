"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button";
import Container from "../ui/Container";

const SHOP_WORDS = ["Ready-made Curtains", "Blinds", "Duvets", "Bed Sheets"];

const GALLERY_WORDS = ["Browse Designs", "Browse Materials"];

function LoopingWord({
  words,
  index,
  minWidthClass = "min-w-[18ch]",
  className = "",
}) {
  return (
    <span
      className={`relative inline-flex ${minWidthClass} justify-start overflow-hidden underline underline-offset-4 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="inline-block whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Hero() {
  const [shopWordIndex, setShopWordIndex] = useState(0);
  const [galleryWordIndex, setGalleryWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShopWordIndex((prev) => (prev + 1) % SHOP_WORDS.length);
      setGalleryWordIndex((prev) => (prev + 1) % GALLERY_WORDS.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-navy text-offwhite">
      <Container>
        <div className="flex min-h-[calc(100vh-5rem)] items-center py-16 sm:py-20 lg:py-24">
          <div className="w-full max-w-4xl space-y-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-beige/90">
              Quick Curtains and Decor
            </p>

            <h1 className="font-display text-4xl leading-tight text-offwhite sm:text-5xl md:text-6xl lg:text-7xl">
              Transform Your Space with Bold Texture, Warmth, and Story
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-offwhite/85 sm:text-base">
              Discover elegant ready-made options or explore custom
              craftsmanship tailored to your home.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href="/shop"
                size="lg"
                variant="secondary"
                className="group w-full justify-center whitespace-normal text-center text-[1.2rem] leading-snug sm:w-auto"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-inherit group-hover:text-offwhite">
                    Shop
                  </span>
                  <LoopingWord
                    words={SHOP_WORDS}
                    index={shopWordIndex}
                    minWidthClass="min-w-[19ch]"
                    className="text-black decoration-black/50 group-hover:text-beige group-hover:decoration-beige/70"
                  />
                </span>
              </Button>

              <Button
                href="/custom-gallery"
                size="lg"
                variant="outline"
                className="group w-full justify-center border-offwhite/80 text-offwhite hover:border-offwhite hover:!bg-navy hover:!text-offwhite whitespace-normal text-center text-[1.2rem] leading-snug sm:w-auto"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-inherit group-hover:text-offwhite">
                    Custom Gallery
                  </span>
                  <LoopingWord
                    words={GALLERY_WORDS}
                    index={galleryWordIndex}
                    minWidthClass="min-w-[16ch]"
                    className="text-beige decoration-beige/70 group-hover:text-beige group-hover:decoration-beige/70"
                  />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
