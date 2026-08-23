"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { CartProvider } from "../../lib/cartContext";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        {!isAdminRoute ? <Header /> : null}
        <main className="flex-1">{children}</main>
        {!isAdminRoute ? <Footer /> : null}
      </div>
    </CartProvider>
  );
}
