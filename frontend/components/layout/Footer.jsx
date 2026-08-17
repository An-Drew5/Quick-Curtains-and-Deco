import Link from "next/link";
import Image from "next/image";
import { Camera, MessageCircle, Users } from "lucide-react";
import Container from "../ui/Container";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Custom Gallery", href: "/custom-gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const socialLinks = [
  { label: "Instagram", href: "#", Icon: Camera },
  { label: "Facebook", href: "#", Icon: Users },
  { label: "WhatsApp", href: "#", Icon: MessageCircle },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy text-offwhite">
      <Container>
        <div className="grid gap-10 py-14 sm:py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beige focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              <Image
                src="/logo.svg"
                alt="Quick Curtains and Decor"
                width={180}
                height={52}
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-offwhite/80">
              Stylish curtains and custom decor designed to transform everyday
              spaces.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg">Quick Links</h2>
            <ul className="mt-4 space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-offwhite/85 transition-colors hover:text-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beige focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm text-offwhite/85">
              <li>Phone: +000 000 000 0000</li>
              <li>Email: hello@example-decor.com</li>
              <li>Address: 123 Placeholder Ave, Accra</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg">Social</h2>
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-offwhite/30 text-offwhite transition-colors hover:border-beige hover:text-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beige focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <div className="border-t border-offwhite/20">
        <Container>
          <div className="py-4 text-center text-xs text-offwhite/75 sm:text-sm">
            © {currentYear} Quick Curtains and Decor. All rights reserved.
          </div>
        </Container>
      </div>
    </footer>
  );
}
