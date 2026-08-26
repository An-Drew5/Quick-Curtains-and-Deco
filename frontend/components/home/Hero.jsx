"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "../ui/Button";
import Container from "../ui/Container";
import gsap from "../../lib/gsap";

const SHOP_WORDS = ["Ready-made Curtains", "Blinds", "Duvets", "Bed Sheets"];

const GALLERY_WORDS = ["Browse Designs", "Browse Materials"];
const HERO_IMAGES = [
  "/images/hero/hero_img_1.jpeg",
  "/images/hero/hero_img_3.jpeg",
  "/images/hero/hero_img_4.jpeg",
];
const HEADLINE = "Transform Your Space with Bold Texture, Warmth, and Story";

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
      <motion.span
        key={words[index]}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="inline-block whitespace-nowrap"
      >
        {words[index]}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const [shopWordIndex, setShopWordIndex] = useState(0);
  const [galleryWordIndex, setGalleryWordIndex] = useState(0);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const sectionRef = useRef(null);
  const backgroundRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setShopWordIndex((prev) => (prev + 1) % SHOP_WORDS.length);
      setGalleryWordIndex((prev) => (prev + 1) % GALLERY_WORDS.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((previous) => (previous + 1) % HERO_IMAGES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const context = gsap.context(() => {
      ScrollTrigger.matchMedia({
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)":
          () => {
            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top top",
                end: "+=100vh",
                pin: true,
                scrub: true,
                invalidateOnRefresh: true,
              },
            });

            timeline
              .to(
                headlineRef.current,
                { opacity: 0, scale: 0.92, ease: "none" },
                0,
              )
              .to(backgroundRef.current, { scale: 1.08, ease: "none" }, 0);
          },
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-navy text-offwhite"
    >
      <div ref={backgroundRef} className="absolute inset-0 scale-100">
        {HERO_IMAGES.map((imagePath, index) => (
          <motion.div
            key={imagePath}
            className="absolute inset-0"
            animate={{ opacity: index === heroImageIndex ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <Image
              src={imagePath}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(27,41,66,0.75)] via-[rgba(27,41,66,0.52)] to-[rgba(27,41,66,0.35)]" />

      <Container>
        <div className="relative flex min-h-[calc(100vh-5rem)] items-center py-16 sm:py-20 lg:py-24">
          <div className="w-full max-w-4xl space-y-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-beige/90">
              Quick Curtains and Decor
            </p>

            <h1
              ref={headlineRef}
              className="font-display text-4xl leading-tight text-offwhite sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {HEADLINE.split(" ").map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className="mr-[0.25em] inline-block"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.055,
                    duration: 0.55,
                    ease: "easeOut",
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-offwhite/85 sm:text-base">
              Discover elegant ready-made options or explore custom
              craftsmanship tailored to your home.
            </p>

            <motion.div
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15, duration: 0.55, ease: "easeOut" }}
            >
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
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
