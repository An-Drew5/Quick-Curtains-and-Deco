import ProductForm from "../../../../components/admin/ProductForm";

export default function NewGalleryItemPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Showcase</p>
        <h1 className="mt-2 font-display text-3xl text-navy">New Gallery Item</h1>
      </header>

      <ProductForm
        mode="create"
        hidePrice
        lockIsCustom
        isCustomValue
        redirectPath="/admin/gallery"
        entityLabel="gallery item"
      />
    </div>
  );
}
