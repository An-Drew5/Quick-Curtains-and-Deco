"use client";

import { useEffect, useState } from "react";
import { slugify } from "../../../components/admin/forms";
import { apiFetch } from "../../../lib/api";

function EditableRow({ category, onSave, onCancel }) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [slugTouched, setSlugTouched] = useState(true);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  return (
    <tr className="border-b border-navy/5 bg-offwhite2 last:border-0">
      <td className="px-4 py-3">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) {
              setSlug(slugify(event.target.value));
            }
          }}
          className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm outline-none"
        />
      </td>
      <td className="px-4 py-3">
        <input
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm outline-none"
        />
      </td>
      <td className="px-4 py-3 text-sm text-muted">{category._count?.products || 0}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave(category.id, { name, slug })}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    slugTouched: false,
  });

  useEffect(() => {
    if (!createForm.slugTouched) {
      setCreateForm((current) => ({
        ...current,
        slug: slugify(current.name),
      }));
    }
  }, [createForm.name, createForm.slugTouched]);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const payload = await apiFetch("/api/categories");
      setCategories(payload.data || []);
    } catch (loadError) {
      setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function createCategory(event) {
    event.preventDefault();
    if (!createForm.name.trim() || !createForm.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name.trim(),
          slug: createForm.slug.trim(),
        }),
      });

      setCategories((current) => [...current, payload.data].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateForm({ name: "", slug: "", slugTouched: false });
    } catch (saveError) {
      setError(saveError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(categoryId, values) {
    if (!values.name.trim() || !values.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = await apiFetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: values.name.trim(),
          slug: values.slug.trim(),
        }),
      });

      setCategories((current) =>
        current
          .map((category) =>
            category.id === categoryId ? payload.data : category,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId("");
    } catch (updateError) {
      setError(updateError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    const hasProducts = (category._count?.products || 0) > 0;
    const warning = hasProducts
      ? "This category has linked products and cannot be deleted yet. Continue to confirm backend behavior?"
      : "Delete this category?";

    const confirmed = window.confirm(warning);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await apiFetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
    } catch (deleteError) {
      setError(deleteError.message.replace(/^API error \(\d+\):\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Catalog</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Categories</h1>
      </header>

      <form
        onSubmit={createCategory}
        className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={createForm.name}
          onChange={(event) =>
            setCreateForm((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Category name"
          className="rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
        />
        <input
          value={createForm.slug}
          onChange={(event) =>
            setCreateForm((current) => ({
              ...current,
              slugTouched: true,
              slug: event.target.value,
            }))
          }
          placeholder="category-slug"
          className="rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-navy px-4 py-3 text-sm font-medium text-offwhite disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add Category"}
        </button>
      </form>

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
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-muted">
          No categories yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-navy/10 bg-offwhite2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) =>
                  editingId === category.id ? (
                    <EditableRow
                      key={category.id}
                      category={category}
                      onSave={updateCategory}
                      onCancel={() => setEditingId("")}
                    />
                  ) : (
                    <tr key={category.id} className="border-b border-navy/5 last:border-0">
                      <td className="px-4 py-3 font-medium text-navy">{category.name}</td>
                      <td className="px-4 py-3 text-muted">{category.slug}</td>
                      <td className="px-4 py-3 text-muted">{category._count?.products || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(category.id)}
                            className="rounded-lg border border-navy/15 bg-white px-2.5 py-1.5 text-xs font-medium text-navy"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(category)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
