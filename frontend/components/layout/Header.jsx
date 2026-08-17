"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingCart, X } from "lucide-react";
import Container from "../ui/Container";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Custom Gallery", href: "/custom-gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function isActive(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ cartCount = 0 }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-black/10 bg-offwhite/95 shadow-sm backdrop-blur"
          : "border-transparent bg-navy/90"
      }`}
    >
      <Container>
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beige focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            <Image
              src="/logo.svg"
              alt="Quick Curtains and Decor"
              width={180}
              height={52}
              priority
            />
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative pb-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite ${
                    scrolled
                      ? active
                        ? "text-navy"
                        : "text-ink hover:text-navy"
                      : active
                        ? "text-offwhite"
                        : "text-offwhite/85 hover:text-offwhite"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 w-full ${scrolled ? "bg-navy" : "bg-beige"}`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                scrolled
                  ? "border-navy/20 text-navy hover:bg-navy/5 focus-visible:ring-navy focus-visible:ring-offset-offwhite"
                  : "border-offwhite/40 text-offwhite hover:bg-white/10 focus-visible:ring-beige focus-visible:ring-offset-navy"
              }`}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-beige px-1 text-xs font-semibold text-navy">
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                scrolled
                  ? "border-navy/20 text-navy focus-visible:ring-navy focus-visible:ring-offset-offwhite"
                  : "border-offwhite/40 text-offwhite focus-visible:ring-beige focus-visible:ring-offset-navy"
              }`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-offwhite px-6 py-8 md:hidden"
          >
            <div className="mx-auto flex h-full w-full max-w-md flex-col">
              <div className="mb-12 flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
                >
                  <Image
                    src="/logo.svg"
                    alt="Quick Curtains and Decor"
                    width={155}
                    height={46}
                  />
                </Link>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy/20 text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close mobile menu"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <nav
                className="flex flex-col gap-2"
                aria-label="Mobile navigation"
              >
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex min-h-11 items-center rounded-xl px-4 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite ${
                        active
                          ? "bg-navy text-offwhite"
                          : "text-ink hover:bg-navy/5"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
