"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const payload = await apiFetch("/api/admin/stats");
        setStats(payload.data);
      } catch (loadError) {
        setError(loadError.message.replace("API error (401): ", ""));
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-navy/10 bg-white"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-navy/10 bg-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: "Orders Today", value: stats?.orders_today ?? 0 },
    { label: "Pending Orders", value: stats?.pending_orders ?? 0 },
    { label: "Revenue This Week", value: formatMoney(stats?.revenue_this_week ?? 0) },
    { label: "Revenue This Month", value: formatMoney(stats?.revenue_this_month ?? 0) },
    { label: "Out of Stock Count", value: stats?.out_of_stock_count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Overview</p>
          <h1 className="mt-2 font-display text-3xl text-navy">Dashboard</h1>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-4 font-display text-3xl text-navy">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-navy">Recent Orders</h2>
          </div>

          {(!stats?.recent_orders || stats.recent_orders.length === 0) ? (
            <div className="rounded-xl border border-dashed border-navy/15 bg-offwhite2 px-4 py-6 text-center text-muted">
              No orders yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-navy/10 text-muted">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Total</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((order) => (
                    <tr key={order.id} className="border-b border-navy/5 last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy hover:underline">
                          {order.customer_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">{formatMoney(order.total_amount)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status] || "bg-slate-100 text-slate-700"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl text-navy">Out of Stock</h2>

          {(!stats?.out_of_stock_products || stats.out_of_stock_products.length === 0) ? (
            <div className="mt-4 rounded-xl border border-dashed border-navy/15 bg-offwhite2 px-4 py-6 text-center text-muted">
              No out-of-stock items
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.out_of_stock_products.map((product) => (
                <li key={product.id}>
                  <Link href={`/admin/products/${product.id}/edit`} className="block rounded-xl border border-navy/10 bg-offwhite2 px-3 py-2 text-sm text-navy hover:border-navy/20 hover:bg-white">
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
