import Section from "../ui/Section";
import Button from "../ui/Button";

const WHATSAPP_NUMBER = "233546153010";
const WHATSAPP_GREETING =
  "Hi, I'd like to know more about your curtains and decor services";

export default function ContactCTA() {
  return (
    <Section background="navy" className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <h2 className="font-display text-3xl text-offwhite sm:text-4xl lg:text-5xl">
          Ready to Transform Your Space?
        </h2>
        <p className="text-sm text-offwhite/80 sm:text-base">
          Tell us your vision, and we will help you shape every room with custom
          detail.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            href="/contact"
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Contact Us
          </Button>
          <Button
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`}
            size="lg"
            variant="outline"
            className="w-full border-offwhite/80 text-offwhite hover:border-offwhite hover:bg-offwhite hover:text-navy sm:w-auto"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
          </Button>
        </div>
      </div>
    </Section>
  );
}
