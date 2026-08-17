import { Suspense } from "react";
import ShopCatalog from "../../components/shop/ShopCatalog";

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopCatalog />
    </Suspense>
  );
}
