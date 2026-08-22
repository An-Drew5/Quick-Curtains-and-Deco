"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "../../../../../components/admin/ProductForm";
import { apiFetch } from "../../../../../lib/api";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    async function loadProduct() {
      try {
        const response = await apiFetch(`/api/admin/products/${id}`);
        const foundProduct = response?.data;

        if (!active) {
          return;
        }

        if (!foundProduct) {
          setError("Product not found.");
          return;
        }

        setProduct(foundProduct);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-muted">
        Loading product...
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
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Catalog</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Edit Product</h1>
      </header>

      <ProductForm mode="edit" initialProduct={product} />
    </div>
  );
}
