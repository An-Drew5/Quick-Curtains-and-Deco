import { Sparkles } from "lucide-react";
import Section from "../ui/Section";
import Button from "../ui/Button";

export default function AboutTeaser() {
  return (
    <Section background="offwhite">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
        {/* Placeholder brand image panel to replace with a real photo later. */}
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-navy/10 bg-offwhite2">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(120deg,_rgba(27,41,66,0.08)_25%,_transparent_25%,_transparent_50%,_rgba(27,41,66,0.08)_50%,_rgba(27,41,66,0.08)_75%,_transparent_75%,_transparent)] [background-size:28px_28px]" />
          <Sparkles
            className="relative h-10 w-10 text-navy/70"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-5">
          <h2 className="font-display text-3xl text-navy sm:text-4xl">
            The Story Behind the Craft
          </h2>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            From consultation to installation, we focus on thoughtful details
            that make every home feel intentional, warm, and uniquely yours.
          </p>
          <Button href="/about" variant="primary" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </Section>
  );
}
