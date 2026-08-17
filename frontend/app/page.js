import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Section from "../components/ui/Section";

export default function Home() {
  return (
    <>
      <Section background="offwhite">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="font-display text-3xl leading-tight text-navy sm:text-4xl lg:text-5xl">
            Layout Foundation Preview
          </h1>
          <p className="text-sm text-muted sm:text-base">
            This is temporary placeholder content between the global header and
            footer while the full homepage sections are built.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="primary" href="/shop">
              Shop Now
            </Button>
            <Button size="lg" variant="outline" href="/contact">
              Contact Us
            </Button>
          </div>
        </div>
      </Section>

      <Section background="offwhite2" className="pt-0">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <h2 className="font-display text-xl text-navy">Reusable Card</h2>
            <p className="mt-2 text-sm text-muted">
              Generic card shell for upcoming product and content blocks.
            </p>
          </Card>
          <Card>
            <h2 className="font-display text-xl text-navy">Section Wrapper</h2>
            <p className="mt-2 text-sm text-muted">
              Shared spacing and background variants for consistent page rhythm.
            </p>
          </Card>
          <Card>
            <h2 className="font-display text-xl text-navy">Animated Buttons</h2>
            <p className="mt-2 text-sm text-muted">
              Framer Motion interactions are enabled for subtle hover and tap
              feedback.
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
