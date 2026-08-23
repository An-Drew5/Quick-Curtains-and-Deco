import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import AppShell from "../components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Quick Curtains & Decor",
  description: "Home decor storefront",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} bg-offwhite2 text-ink antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
