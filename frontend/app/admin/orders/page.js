"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PaginationControls from "../../../components/admin/PaginationControls";
import StatusBadge from "../../../components/admin/StatusBadge";
import { formatDate, formatMoney } from "../../../components/admin/forms";
import { apiFetch } from "../../../lib/api";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function shortenId(id) {
  if (!id) return "-";
  return `${id.slice(0, 8)}...`;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState({ orders: [], page: 1, totalPages: 1, total: 0 });

  const selectedStatus = searchParams.get("status") || "all";
  const page = Number(searchParams.get("page") || "1");

  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", "10");
    if (selectedStatus !== "all") {
      query.set("status", selectedStatus);
    }
    return query.toString();
  }, [page, selectedStatus]);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const payload = await apiFetch(`/api/admin/orders?${queryString}`);
        if (!active) return;
        setResult(payload.data);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [queryString]);

  function updateQuery(nextStatus, nextPage) {
    const query = new URLSearchParams(searchParams.toString());

    if (nextStatus === "all") {
      query.delete("status");
    } else {
      query.set("status", nextStatus);
    }

    query.set("page", String(nextPage));
    router.push(`/admin/orders?${query.toString()}`);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Sales</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Orders</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = selectedStatus === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => updateQuery(filter.value, 1)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-navy bg-navy text-offwhite"
                  : "border-navy/15 bg-white text-navy hover:border-navy/30"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-navy/10 bg-white p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-offwhite2" />
          ))}
        </div>
      ) : result.orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-muted">
          {selectedStatus === "all"
            ? "No orders yet"
            : "No orders match this filter"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-offwhite2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {result.orders.map((order) => (
                  <tr key={order.id} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-navy hover:underline"
                      >
                        {shortenId(order.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.customer_name}</td>
                    <td className="px-4 py-3">{formatMoney(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationControls
        page={result.page || 1}
        totalPages={result.totalPages || 1}
        onPrevious={() => updateQuery(selectedStatus, Math.max(1, page - 1))}
        onNext={() =>
          updateQuery(selectedStatus, Math.min(result.totalPages || 1, page + 1))
        }
      />
    </div>
  );
}
