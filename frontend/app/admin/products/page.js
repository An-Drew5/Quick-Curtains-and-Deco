"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

const STOCK_BADGES = {
  in_stock: "bg-emerald-100 text-emerald-700",
  out_of_stock: "bg-red-100 text-red-700",
  made_to_order: "bg-violet-100 text-violet-700",
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const payload = await apiFetch("/api/categories");
        setCategories(payload.data || []);
      } catch (categoriesError) {
        console.error(categoriesError);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ page: String(page), limit: "10", is_custom: "false" });
        if (search.trim()) params.set("search", search.trim());
        if (selectedCategory !== "all") params.set("category", selectedCategory);

        const payload = await apiFetch(`/api/products?${params.toString()}`);
        if (ignore) return;

        setProducts(payload.data?.products || []);
        setTotalPages(payload.data?.totalPages || 1);
      } catch (loadError) {
        if (ignore) return;
        setError(loadError.message);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      ignore = true;
    };
  }, [page, search, selectedCategory]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      if (!search.trim()) return true;
      return product.name.toLowerCase().includes(search.trim().toLowerCase());
    });
  }, [products, search]);

  async function handleDelete(productId) {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      setProducts((current) => current.filter((product) => product.id !== productId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Inventory</p>
          <h1 className="mt-2 font-display text-3xl text-navy">Products</h1>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-offwhite"
        >
          + Add Product
        </Link>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name"
            className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
          />

          <select
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-8 text-sm text-muted">
          Loading products...
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-muted">
          No products found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-offwhite2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-navy/10 bg-offwhite2">
                          {product.thumbnail?.url ? (
                            <img src={product.thumbnail.url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">IMG</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-navy">{product.name}</p>
                          <p className="text-xs text-muted">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.category?.name || "—"}</td>
                    <td className="px-4 py-3">{formatMoney(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STOCK_BADGES[product.stock_status] || "bg-slate-100 text-slate-700"}`}>
                        {product.stock_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg border border-navy/15 bg-white px-2.5 py-1.5 text-xs font-medium text-navy"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
