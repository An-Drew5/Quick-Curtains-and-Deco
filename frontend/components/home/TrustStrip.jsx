"use client";

import { useEffect, useRef } from "react";
import { BadgeCheck, Ruler, ShieldCheck, Truck } from "lucide-react";
import Section from "../ui/Section";
import gsap from "../../lib/gsap";

const trustItems = [
  { label: "Free Consultation", Icon: BadgeCheck },
  { label: "Premium Fabrics", Icon: ShieldCheck },
  { label: "Nationwide Delivery", Icon: Truck },
  { label: "Expert Installation", Icon: Ruler },
];

export default function TrustStrip() {
  const itemRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemRefs.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: itemRefs.current[0],
            start: "top 90%",
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <Section
      background="offwhite"
      className="py-8 sm:py-10"
      containerClassName="px-4 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {trustItems.map(({ label, Icon }, index) => (
          <div
            key={label}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="flex items-center gap-2 rounded-xl border border-navy/10 bg-offwhite2 px-3 py-3 text-navy sm:gap-3"
          >
            <Icon
              className="h-4 w-4 shrink-0 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
            <span className="text-xs font-medium leading-snug sm:text-sm">
              {label}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
