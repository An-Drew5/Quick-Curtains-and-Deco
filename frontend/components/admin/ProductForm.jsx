"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../lib/cloudinaryImage";

const STOCK_OPTIONS = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "made_to_order", label: "Made to Order" },
];

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export default function ProductForm({
  mode = "create",
  initialProduct = null,
  hidePrice = false,
  lockIsCustom = false,
  isCustomValue = false,
  redirectPath = "/admin/products",
  entityLabel = "product",
}) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaItems, setMediaItems] = useState(initialProduct?.media || []);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProduct?.slug));

  const [form, setForm] = useState({
    name: initialProduct?.name || "",
    slug: initialProduct?.slug || "",
    category_id: initialProduct?.category?.id || "",
    description: initialProduct?.description || "",
    price: initialProduct?.price || "",
    stock_status: initialProduct?.stock_status || "in_stock",
    is_custom: lockIsCustom
      ? isCustomValue
      : (initialProduct?.is_custom ?? false),
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const payload = await apiFetch("/api/categories");
        setCategories(payload.data || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setCategoryLoading(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (!slugTouched && form.name) {
      setForm((current) => ({ ...current, slug: slugify(current.name) }));
    }
  }, [form.name, slugTouched]);

  useEffect(() => {
    if (initialProduct?.media) {
      setMediaItems(initialProduct.media);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (lockIsCustom) {
      setForm((current) => ({
        ...current,
        is_custom: isCustomValue,
      }));
    }
  }, [lockIsCustom, isCustomValue]);

  const productId = initialProduct?.id || null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCloudinaryUpload(file) {
    if (!file) return;
    if (!productId) {
      setError(`Save the ${entityLabel} before uploading media.`);
      return;
    }

    try {
      setImageLoading(true);
      setError("");

      const signatureResponse = await apiFetch("/api/uploads/signature");
      const { signature, timestamp, cloudName, apiKey, folder } =
        signatureResponse.data;

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("timestamp", String(timestamp));
      cloudinaryFormData.append("signature", signature);
      cloudinaryFormData.append("folder", folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: cloudinaryFormData,
        },
      );

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.error?.message || "Image upload failed.");
      }

      const mediaPayload = {
        url: uploadData.secure_url,
        type: uploadData.resource_type === "video" ? "video" : "image",
        sort_order: mediaItems.length,
      };

      const savedMedia = await apiFetch(
        `/api/admin/products/${productId}/media`,
        {
          method: "POST",
          body: JSON.stringify(mediaPayload),
        },
      );

      setMediaItems((current) => [...current, savedMedia.data]);
    } catch (uploadError) {
      setError(uploadError.message || "Image upload failed.");
    } finally {
      setImageLoading(false);
    }
  }

  async function handleDeleteMedia(mediaId) {
    if (!productId) return;

    const confirmed = window.confirm("Delete this image?");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/admin/products/${productId}/media/${mediaId}`, {
        method: "DELETE",
      });
      setMediaItems((current) => current.filter((item) => item.id !== mediaId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function moveMedia(index, direction) {
    if (!productId || index < 0 || !mediaItems[index]) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mediaItems.length) return;

    const updated = [...mediaItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    const orderedMedia = updated.map((item, itemIndex) => ({
      id: item.id,
      sort_order: itemIndex,
    }));

    setMediaItems(updated);

    try {
      await apiFetch(`/api/admin/products/${productId}/media/reorder`, {
        method: "PUT",
        body: JSON.stringify({ order: orderedMedia }),
      });
    } catch (reorderError) {
      setError(reorderError.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();
    const numericPrice = Number(form.price || 0);

    if (!trimmedName || !trimmedSlug || !form.category_id) {
      setError("Please complete all required fields.");
      setLoading(false);
      return;
    }

    if (!hidePrice && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
      setError("Please provide a valid price greater than 0.");
      setLoading(false);
      return;
    }

    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      category_id: form.category_id,
      description: form.description.trim(),
      price: hidePrice ? "0.00" : numericPrice.toFixed(2),
      stock_status: form.stock_status,
      is_custom: lockIsCustom ? isCustomValue : form.is_custom,
    };

    try {
      if (mode === "edit" && initialProduct?.id) {
        await apiFetch(`/api/admin/products/${initialProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      router.push(redirectPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError.message.replace(/^API error \(\d+\):\s*/, "").trim() ||
          "Could not save. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              Name
            </label>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              placeholder="Luna Linen Curtain Set"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              Slug
            </label>
            <input
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                updateField("slug", event.target.value);
              }}
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              placeholder="luna-linen-curtain-set"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              Category
            </label>
            {categoryLoading ? (
              <div className="rounded-xl border border-navy/10 bg-offwhite2 px-3 py-3 text-sm text-muted">
                Loading categories...
              </div>
            ) : (
              <select
                value={form.category_id}
                onChange={(event) =>
                  updateField("category_id", event.target.value)
                }
                className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={5}
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              placeholder="Add a product summary..."
            />
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          {!hidePrice ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-navy">
                Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                placeholder="0.00"
                required
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              Stock status
            </label>
            <select
              value={form.stock_status}
              onChange={(event) =>
                updateField("stock_status", event.target.value)
              }
              className="w-full rounded-xl border border-navy/15 bg-offwhite2 px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
            >
              {STOCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-navy/10 bg-offwhite2 p-3 text-sm text-muted">
            <p className="font-medium text-navy">
              {lockIsCustom && isCustomValue
                ? "Gallery item"
                : "Ready-made product"}
            </p>
            <p className="mt-1">
              {lockIsCustom && isCustomValue
                ? "This item is locked as custom/gallery content."
                : "Custom/gallery items are managed separately."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-navy">Media</h2>
            <p className="text-sm text-muted">Manage the item gallery.</p>
          </div>

          {!productId ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Save the {entityLabel} first to enable uploads.
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-navy/15 bg-navy px-4 py-2 text-sm font-medium text-offwhite transition hover:bg-navy/90">
              {imageLoading ? "Uploading..." : "Upload image"}
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleCloudinaryUpload(event.target.files?.[0])
                }
                className="hidden"
              />
            </label>
          )}
        </div>

        {mediaItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy/15 bg-offwhite2 px-4 py-8 text-center text-muted">
            No media uploaded yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mediaItems.map((media, index) => (
              <div
                key={media.id}
                className="overflow-hidden rounded-2xl border border-navy/10 bg-offwhite2"
              >
                <div className="relative">
                  <img
                    src={cloudinaryImageUrl(media.url, {
                      width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                    })}
                    alt="Product media"
                    className="h-40 w-full object-cover"
                  />
                  <div className="absolute right-2 top-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveMedia(index, -1)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs text-navy"
                      aria-label="Move media up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMedia(index, 1)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs text-navy"
                      aria-label="Move media down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(media.id)}
                      className="rounded-md bg-red-500 px-2 py-1 text-xs text-white"
                      aria-label="Delete media"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(redirectPath)}
          className="rounded-xl border border-navy/15 bg-transparent px-4 py-2.5 text-sm font-medium text-navy"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || categoryLoading}
          className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-offwhite disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
