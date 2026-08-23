"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PackageSearch, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../../lib/api";
import {
  cloudinaryImageUrl,
  CLOUDINARY_IMAGE_WIDTHS,
} from "../../lib/cloudinaryImage";
import Section from "../ui/Section";
import Container from "../ui/Container";
import Card from "../ui/Card";
import Button from "../ui/Button";

function buildQueryString(params) {
  const query = new URLSearchParams();

  if (params.category) {
    query.set("category", params.category);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.page && params.page !== 1) {
    query.set("page", String(params.page));
  }

  return query.toString();
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));
}

function ProductSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="aspect-square animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function ShopCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") || "";
  const searchParam = searchParams.get("search") || "";
  const pageParam = Number(searchParams.get("page") || "1") || 1;

  const [categories, setCategories] = useState([]);
  const [productsData, setProductsData] = useState({
    products: [],
    total: 0,
    totalPages: 1,
    page: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(searchParam);
    setDebouncedSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (debouncedSearch === searchParam) {
      return;
    }

    updateUrl({
      category: categoryParam,
      search: debouncedSearch,
      page: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await apiFetch("/api/categories");
        const items = Array.isArray(response?.data) ? response.data : [];
        if (isMounted) {
          setCategories(items);
        }
      } catch (err) {
        if (isMounted) {
          setError("Unable to load categories right now.");
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        if (categoryParam) {
          query.set("category", categoryParam);
        }
        if (debouncedSearch) {
          query.set("search", debouncedSearch);
        }
        query.set("page", String(pageParam || 1));
        query.set("limit", "8");

        const response = await apiFetch(`/api/products?${query.toString()}`);
        if (!isMounted) {
          return;
        }

        setProductsData(
          response?.data || { products: [], total: 0, totalPages: 1, page: 1 },
        );
      } catch (err) {
        if (isMounted) {
          setError("Unable to load products right now.");
          setProductsData({ products: [], total: 0, totalPages: 1, page: 1 });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categoryParam, debouncedSearch, pageParam]);

  const categoriesWithAll = useMemo(
    () => [{ id: "all", name: "All", slug: "" }, ...categories],
    [categories],
  );

  function updateUrl(nextParams) {
    const query = buildQueryString(nextParams);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleCategoryChange(slug) {
    updateUrl({
      category: slug,
      search: debouncedSearch,
      page: 1,
    });
  }

  function handleSearchChange(event) {
    setSearchInput(event.target.value);
  }

  function handlePageChange(nextPage) {
    updateUrl({
      category: categoryParam,
      search: debouncedSearch,
      page: nextPage,
    });
  }

  const products = productsData.products || [];
  const hasProducts = products.length > 0;

  return (
    <Section background="offwhite2" className="py-12 sm:py-14 lg:py-16">
      <Container>
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="font-display text-4xl text-navy sm:text-5xl">
              Shop
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Browse ready-made curtains, blinds, wallpapers, and bed sheets
              with shareable filters and searchable product pages.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="space-y-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <label
                  htmlFor="shop-search"
                  className="block text-sm font-medium text-ink"
                >
                  Search products
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="shop-search"
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder="Search curtains, blinds..."
                    className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-ink">Categories</p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
                  {categoriesLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-10 min-w-24 animate-pulse rounded-full bg-slate-200"
                        />
                      ))
                    : categoriesWithAll.map((category) => {
                        const active = category.slug === categoryParam;

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategoryChange(category.slug)}
                            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
                              active
                                ? "border-navy bg-navy text-offwhite"
                                : "border-slate-200 bg-white text-ink hover:border-navy hover:text-navy"
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <ProductSkeletonCard key={index} />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center shadow-sm">
                  <p className="font-display text-2xl text-navy">
                    Something went wrong
                  </p>
                  <p className="mt-2 text-sm text-muted">{error}</p>
                </div>
              ) : !hasProducts ? (
                <div className="rounded-2xl border border-navy/10 bg-white p-10 text-center shadow-sm">
                  <PackageSearch
                    className="mx-auto h-10 w-10 text-muted"
                    aria-hidden="true"
                  />
                  <h2 className="mt-4 font-display text-2xl text-navy">
                    No products found
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
                    Try clearing the filters or searching with a different
                    keyword.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Button href="/shop" variant="secondary">
                      Reset Shop
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.slug}`}
                      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite2"
                    >
                      <Card className="relative h-full overflow-hidden p-0 transition-transform duration-200 group-hover:-translate-y-1">
                        <div className="relative aspect-square bg-slate-100">
                          {product.stock_status === "out_of_stock" && (
                            <div className="absolute right-3 top-3 z-10 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                              Out of Stock
                            </div>
                          )}

                          {product.thumbnail?.url ? (
                            <Image
                              src={cloudinaryImageUrl(product.thumbnail.url, {
                                width: CLOUDINARY_IMAGE_WIDTHS.thumbnail,
                              })}
                              alt={product.name}
                              fill
                              unoptimized
                              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                              <span className="text-xs font-medium text-muted">
                                Image coming soon
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted">
                            {product.category?.name || "Uncategorized"}
                          </p>
                          <h2 className="line-clamp-2 font-display text-lg leading-tight text-navy">
                            {product.name}
                          </h2>
                          <p className="text-sm font-semibold text-ink">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {!isLoading && !error && productsData.totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(Math.max(1, pageParam - 1))}
                    disabled={pageParam <= 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Previous
                  </Button>

                  <p className="text-sm text-muted">
                    Page {productsData.page || pageParam} of{" "}
                    {productsData.totalPages || 1}
                  </p>

                  <Button
                    variant="outline"
                    onClick={() =>
                      handlePageChange(
                        Math.min(productsData.totalPages, pageParam + 1),
                      )
                    }
                    disabled={pageParam >= productsData.totalPages}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
