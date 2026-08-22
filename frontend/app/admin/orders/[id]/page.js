"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "../../../../components/admin/StatusBadge";
import { formatDate, formatMoney } from "../../../../components/admin/forms";
import { apiFetch } from "../../../../lib/api";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadOrder() {
      setLoading(true);
      setError("");

      try {
        const payload = await apiFetch(`/api/admin/orders/${id}`);
        if (!active) return;
        setOrder(payload.data);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [id]);

  const latestTransaction = useMemo(() => order?.transactions?.[0] || null, [order]);

  async function handleStatusChange(nextStatus) {
    if (!order || nextStatus === order.status) return;

    setSaving(true);
    setError("");

    try {
      const payload = await apiFetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });

      setOrder((current) => ({
        ...current,
        status: payload.data.status,
      }));
    } catch (statusError) {
      setError(statusError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-navy/10 bg-white p-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-lg bg-offwhite2" />
        ))}
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-dashed border-navy/15 bg-white px-4 py-6 text-center text-muted">
        Order not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Sales</p>
          <h1 className="mt-2 font-display text-3xl text-navy">Order Detail</h1>
        </header>

        <Link href="/admin/orders" className="text-sm font-medium text-navy hover:underline">
          Back to Orders
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Customer</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Name</dt>
                <dd className="mt-1 text-sm text-ink">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Phone</dt>
                <dd className="mt-1 text-sm text-ink">{order.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Email</dt>
                <dd className="mt-1 text-sm text-ink">{order.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Order date</dt>
                <dd className="mt-1 text-sm text-ink">{formatDate(order.created_at)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Address</dt>
                <dd className="mt-1 text-sm text-ink">{order.address || "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Items</h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-navy/10 text-muted">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium">Qty</th>
                    <th className="pb-3 pr-4 font-medium">Unit Price</th>
                    <th className="pb-3 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.id} className="border-b border-navy/5 last:border-0">
                      <td className="py-3 pr-4">{item.product?.name || "Product"}</td>
                      <td className="py-3 pr-4">{item.quantity}</td>
                      <td className="py-3 pr-4">{formatMoney(item.unit_price)}</td>
                      <td className="py-3">{formatMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 border-t border-navy/10 pt-4 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Delivery fee</span>
                <span className="font-medium text-ink">{formatMoney(order.delivery_fee)}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-base">
                <span className="font-semibold text-navy">Total</span>
                <span className="font-semibold text-navy">{formatMoney(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Order Status</h2>
            <div className="mt-3">
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-navy">
                Update status
              </label>
              <select
                value={order.status}
                onChange={(event) => handleStatusChange(event.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-60"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {saving ? (
                <p className="mt-2 text-xs text-muted">Saving status...</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-navy">Payment</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Reference</dt>
                <dd className="mt-1 text-ink">
                  {latestTransaction?.paystack_reference || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Payment status</dt>
                <dd className="mt-1">
                  <StatusBadge status={latestTransaction?.status || "pending"} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Verified at</dt>
                <dd className="mt-1 text-ink">
                  {latestTransaction?.verified_at
                    ? formatDate(latestTransaction.verified_at)
                    : "Not verified yet"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
