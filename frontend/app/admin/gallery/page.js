"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PaginationControls from "../../../components/admin/PaginationControls";
import StatusBadge from "../../../components/admin/StatusBadge";
import { apiFetch } from "../../../lib/api";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../../lib/cloudinaryImage";

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);
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
      } catch (loadError) {
        console.error(loadError);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadGallery() {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        query.set("page", String(page));
        query.set("limit", "10");
        query.set("is_custom", "true");
        if (search.trim()) query.set("search", search.trim());
        if (selectedCategory !== "all") query.set("category", selectedCategory);

        const payload = await apiFetch(
          `/api/admin/products?${query.toString()}`,
        );
        if (!active) return;

        const products = payload?.data?.products || [];
        setItems(products);
        setTotalPages(payload?.data?.totalPages || 1);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGallery();

    return () => {
      active = false;
    };
  }, [page, search, selectedCategory]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, search]);

  async function handleDelete(itemId) {
    const confirmed = window.confirm("Delete this gallery item?");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/admin/products/${itemId}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (deleteError) {
      setError(deleteError.message.replace(/^API error \(\d+\):\s*/, ""));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Showcase
          </p>
          <h1 className="mt-2 font-display text-3xl text-navy">Gallery</h1>
        </header>

        <Link
          href="/admin/gallery/new"
          className="inline-flex items-center justify-center rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-offwhite"
        >
          + Add Gallery Item
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
        <div className="space-y-2 rounded-2xl border border-navy/10 bg-white p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-10 animate-pulse rounded-lg bg-offwhite2"
            />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-muted">
          No gallery items yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-offwhite2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-navy/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-navy/10 bg-offwhite2">
                          {item.thumbnail?.url ? (
                            <img
                              src={cloudinaryImageUrl(item.thumbnail.url, {
                                width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                              })}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                              IMG
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-navy">{item.name}</p>
                          <p className="text-xs text-muted">{item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.category?.name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.stock_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/gallery/${item.id}/edit`}
                          className="rounded-lg border border-navy/15 bg-white px-2.5 py-1.5 text-xs font-medium text-navy"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
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

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
      />
    </div>
  );
}
