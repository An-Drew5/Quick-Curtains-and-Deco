import { SwatchBook } from "lucide-react";
import Section from "../ui/Section";
import Button from "../ui/Button";

export default function CustomGalleryTeaser() {
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

        {/* Placeholder tile blocks until real custom-gallery imagery is available. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-offwhite/25 bg-gradient-to-br from-navy via-[#243654] to-[#31476d]"
            >
              <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,_#F2EBDD_1px,_transparent_0)] [background-size:14px_14px]" />
              <SwatchBook
                className="relative h-8 w-8 text-beige"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
