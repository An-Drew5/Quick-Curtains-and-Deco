import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

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
        <div className="flex min-h-screen flex-col">
          <Header cartCount={0} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
