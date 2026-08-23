"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import gsap from "../../lib/gsap";

const PHONE_ONE = "0542936070";
const PHONE_TWO = "0546153010";
const WHATSAPP_NUMBER_INTL = "233546153010";
const EMAIL = "andrews.oppongx@gmail.com";
const LOCATION = "Kumasi - Tech, Top High";
const WHATSAPP_GREETING =
  "Hi, I'd like to know more about your curtains and decor services";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [error, setError] = useState("");

  const headingRef = useRef(null);
  const contactGridRef = useRef(null);
  const formRef = useRef(null);
  const infoCardRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [headingRef.current, contactGridRef.current, formRef.current],
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 88%",
          },
        },
      );

      gsap.fromTo(
        infoCardRefs.current,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: contactGridRef.current,
            start: "top 85%",
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  const whatsappHref = useMemo(() => {
    return `https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please complete all fields before sending.");
      return;
    }

    // Temporary client-side fallback: opens the user's email app with prefilled content.
    // Long-term solution should use a backend endpoint (for example POST /api/contact).
    const subject = encodeURIComponent(`Website Contact - ${form.name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\nMessage:\n${form.message.trim()}`,
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <Section background="offwhite2" className="pb-8 sm:pb-10 lg:pb-12">
        <div ref={headingRef} className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
            Get In Touch
          </p>
          <h1 className="font-display text-4xl text-navy sm:text-5xl lg:text-6xl">
            Contact Us
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Reach us directly by phone, WhatsApp, or email. We are happy to
            help you plan your curtains and decor needs.
          </p>
        </div>
      </Section>

      <Section background="offwhite" className="py-8 sm:py-10 lg:py-12">
        <div ref={contactGridRef} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            className="h-full border-navy/10 p-5"
            ref={(node) => {
              infoCardRefs.current[0] = node;
            }}
          >
            <div className="space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl text-navy">Phone</h2>
              <div className="space-y-2 text-sm text-muted sm:text-base">
                <a href={`tel:${PHONE_ONE}`} className="block font-medium text-ink hover:text-navy">
                  {PHONE_ONE}
                </a>
                <a href={`tel:${PHONE_TWO}`} className="block font-medium text-ink hover:text-navy">
                  {PHONE_TWO}
                </a>
              </div>
            </div>
          </Card>

          <Card
            className="h-full border-navy/10 p-5"
            ref={(node) => {
              infoCardRefs.current[1] = node;
            }}
          >
            <div className="space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl text-navy">WhatsApp</h2>
              <p className="text-sm text-muted sm:text-base">{PHONE_TWO}</p>
              <Button
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="w-full justify-center"
              >
                Chat on WhatsApp
              </Button>
            </div>
          </Card>

          <Card
            className="h-full border-navy/10 p-5"
            ref={(node) => {
              infoCardRefs.current[2] = node;
            }}
          >
            <div className="space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl text-navy">Email</h2>
              <a
                href={`mailto:${EMAIL}`}
                className="break-all text-sm font-medium text-ink hover:text-navy sm:text-base"
              >
                {EMAIL}
              </a>
            </div>
          </Card>

          <Card
            className="h-full border-navy/10 p-5"
            ref={(node) => {
              infoCardRefs.current[3] = node;
            }}
          >
            <div className="space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl text-navy">Location</h2>
              <p className="text-sm font-medium text-ink sm:text-base">{LOCATION}</p>
              {/* Optional enhancement: add map embed once an exact map URL or coordinates are available. */}
            </div>
          </Card>
        </div>
      </Section>

      <Section background="offwhite2" className="py-8 sm:py-10 lg:py-12">
        <div ref={formRef} className="mx-auto max-w-3xl rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-2">
            <h2 className="font-display text-3xl text-navy sm:text-4xl">
              Send a Message
            </h2>
            <p className="text-sm text-muted sm:text-base">
              Fill out the form and we will open your email app with your
              message prefilled.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                placeholder="Your full name"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                placeholder="you@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Message</span>
              <textarea
                rows={5}
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                placeholder="Tell us what you need for your space"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" size="lg" className="w-full justify-center sm:w-auto">
                Send via Email App
              </Button>
              <p className="text-xs text-muted sm:text-sm">
                Temporary mailto fallback until a backend contact endpoint is
                added.
              </p>
            </div>
          </form>
        </div>
      </Section>
    </>
  );
}