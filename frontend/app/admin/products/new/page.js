import ProductForm from "../../../../components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Catalog</p>
        <h1 className="mt-2 font-display text-3xl text-navy">New Product</h1>
      </header>

      <ProductForm mode="create" />
    </div>
  );
}
