"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Gallery", href: "/admin/gallery" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Categories", href: "/admin/categories" },
];

function AdminLayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setCheckingAuth(false);
      return;
    }

    let active = true;

    async function checkAdminSession() {
      try {
        await apiFetch("/api/auth/me");
      } catch (_error) {
        if (!active) return;
        router.replace("/admin/login");
        return;
      }

      if (active) {
        setCheckingAuth(false);
      }
    }

    checkAdminSession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (_error) {
      // Ignore backend errors here; still redirect to the login page.
    }

    router.push("/admin/login");
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite2 text-navy">
        <div className="rounded-2xl border border-navy/10 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm font-medium tracking-[0.2em] text-muted uppercase">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite2 text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className={`${mobileNavOpen ? "block" : "hidden"} border-b border-navy/10 bg-navy px-4 py-5 text-offwhite lg:block lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-6 lg:py-8`}>
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="font-display text-2xl">Quick Curtains</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-offwhite/70">
                Admin Dashboard
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-offwhite/20 px-3 py-2 text-sm text-offwhite lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            >
              Close
            </button>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              const linkClassName = [
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                isActive
                  ? "bg-offwhite text-navy shadow-sm"
                  : "text-offwhite/80 hover:bg-white/5 hover:text-offwhite",
              ].join(" ");

              return (
                <div key={item.label}>
                  <Link href={item.href} className={linkClassName}>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-beige" aria-hidden="true" />
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl border border-offwhite/20 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-offwhite transition hover:bg-white/5"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-navy/10 bg-white/70 backdrop-blur-sm lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="font-display text-xl text-navy">Quick Curtains</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  Admin
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen((previous) => !previous)}
                className="rounded-lg border border-navy/15 px-3 py-2 text-sm font-medium text-navy"
              >
                Menu
              </button>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
