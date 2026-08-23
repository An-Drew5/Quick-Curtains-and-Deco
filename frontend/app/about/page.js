"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Brush, Ruler, ShieldCheck, Truck } from "lucide-react";
import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import gsap from "../../lib/gsap";

const valueProps = [
  { title: "Quality Fabrics", Icon: ShieldCheck },
  { title: "Expert Installation", Icon: Ruler },
  { title: "Custom Design Service", Icon: Brush },
  { title: "Nationwide Delivery", Icon: Truck },
];

export default function AboutPage() {
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const valueRef = useRef(null);
  const whyRef = useRef(null);
  const ctaRef = useRef(null);
  const valueItemRefs = useRef([]);

  useEffect(() => {
    const sections = [
      heroRef.current,
      storyRef.current,
      valueRef.current,
      whyRef.current,
      ctaRef.current,
    ].filter(Boolean);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        sections,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top 88%",
          },
        },
      );

      gsap.fromTo(
        valueItemRefs.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: valueRef.current,
            start: "top 86%",
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <Section background="offwhite2" className="pb-8 sm:pb-10 lg:pb-12">
        <div ref={heroRef} className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
            About Us
          </p>
          <h1 className="max-w-4xl font-display text-4xl leading-tight text-navy sm:text-5xl lg:text-6xl">
            Quick Curtains and Decor
          </h1>
          {/* Placeholder tagline: refine with the final brand line later. */}
          <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            Transforming homes across Kumasi with quality curtains, blinds, and
            decor.
          </p>
        </div>
      </Section>

      <Section background="offwhite" className="py-8 sm:py-10 lg:py-12">
        <div ref={storyRef} className="grid gap-6 rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <h2 className="font-display text-3xl text-navy sm:text-4xl">
              Our Story
            </h2>
            {/* Placeholder brand story copy: replace with real history and founder journey later. */}
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              Quick Curtains and Decor began with a simple goal: help families
              and businesses create warm, expressive interiors through thoughtful
              fabric and finish choices. We focus on practical elegance that
              balances function, style, and everyday comfort.
            </p>
            {/* Placeholder brand story copy: replace with real history and founder journey later. */}
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              From first consultation to final installation, our team treats each
              space as unique. We listen closely, recommend options that match
              your lifestyle, and pay attention to the details that make each
              window and wall feel complete.
            </p>
            {/* Placeholder brand story copy: replace with real history and founder journey later. */}
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              Whether you want a ready-made update or a fully custom concept,
              our mission is to deliver durable workmanship, polished results,
              and a service experience that feels personal from start to finish.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-navy/20 bg-offwhite2 p-6">
            <h3 className="font-display text-2xl text-navy">Our Promise</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
              <li>Tailored recommendations for your space and budget</li>
              <li>Consistent quality checks from measuring to finishing</li>
              <li>Friendly support before, during, and after installation</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section background="offwhite2" className="py-8 sm:py-10 lg:py-12">
        <div ref={valueRef} className="space-y-5">
          <h2 className="font-display text-3xl text-navy sm:text-4xl">
            What We Value
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {valueProps.map(({ title, Icon }, index) => (
              <div
                key={title}
                ref={(node) => {
                  valueItemRefs.current[index] = node;
                }}
                className="flex items-center gap-2 rounded-xl border border-navy/10 bg-offwhite px-3 py-3 text-navy sm:gap-3"
              >
                <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="text-xs font-medium leading-snug sm:text-sm">
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section background="offwhite" className="py-8 sm:py-10 lg:py-12">
        <div ref={whyRef} className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="rounded-3xl border border-navy/10 bg-gradient-to-br from-navy via-[#213350] to-[#31486f] p-8 text-offwhite">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-beige/90">
              Why Choose Us
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Crafted detail, practical comfort, and service you can trust
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-offwhite/85 sm:text-base">
              We blend design direction with everyday durability, so your home
              looks elevated and stays easy to live in.
            </p>
          </div>

          <Card className="h-full border-navy/10">
            <div className="space-y-4">
              <h3 className="font-display text-2xl text-navy">How We Work</h3>
              <p className="text-sm leading-relaxed text-muted sm:text-base">
                We guide you through style selection, measurements, and product
                recommendations that suit your room layout and lighting.
              </p>
              <p className="text-sm leading-relaxed text-muted sm:text-base">
                Every project is delivered with careful finishing, clear updates,
                and flexible support so the final result feels intentional and
                lasting.
              </p>
              <Link
                href="/contact"
                className="inline-flex text-sm font-semibold text-navy underline decoration-navy/30 underline-offset-4 hover:decoration-navy"
              >
                Speak with our team
              </Link>
            </div>
          </Card>
        </div>
      </Section>

      <Section background="navy" className="py-12 sm:py-14 lg:py-16">
        <div ref={ctaRef} className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="font-display text-3xl text-offwhite sm:text-4xl lg:text-5xl">
            Ready to style your space?
          </h2>
          <p className="text-sm leading-relaxed text-offwhite/80 sm:text-base">
            Explore our ready-made collection or browse custom inspiration built
            for homes like yours.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button href="/shop" size="lg" variant="secondary" className="w-full sm:w-auto">
              Shop Products
            </Button>
            <Button
              href="/custom-gallery"
              size="lg"
              variant="outline"
              className="w-full border-offwhite/80 text-offwhite hover:border-offwhite hover:bg-offwhite hover:text-navy sm:w-auto"
            >
              View Custom Gallery
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}