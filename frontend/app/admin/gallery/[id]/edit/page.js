"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "../../../../../components/admin/ProductForm";
import { apiFetch } from "../../../../../lib/api";

export default function EditGalleryItemPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadItem() {
      try {
        const response = await apiFetch(`/api/admin/products/${id}`);
        if (!active) return;

        if (!response?.data) {
          setError("Gallery item not found.");
          return;
        }

        setItem(response.data);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message.replace(/^API error \(\d+\):\s*/, ""));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-muted">
        Loading gallery item...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Showcase</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Edit Gallery Item</h1>
      </header>

      <ProductForm
        mode="edit"
        initialProduct={item}
        hidePrice
        lockIsCustom
        isCustomValue
        redirectPath="/admin/gallery"
        entityLabel="gallery item"
      />
    </div>
  );
}
