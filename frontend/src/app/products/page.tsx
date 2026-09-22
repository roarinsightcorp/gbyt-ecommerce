"use client";

import {
FormEvent,
useCallback,
useEffect,
useMemo,
useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
getCategories,
getProducts,
} from "@/lib/api/products";

import type {
Category,
Product,
} from "@/types/product";

function formatPrice(price: string) {
const amount = Number(price);

if (Number.isNaN(amount)) {
return price;
}

return new Intl.NumberFormat("en-NG", {
style: "currency",
currency: "NGN",
maximumFractionDigits: 2,
}).format(amount);
}

function getProductImage(product: Product): string | null {
return product.primary_image?.url ?? product.media?.[0]?.url ?? null;
}

function ProductCard({ product }: { product: Product }) {
const image = getProductImage(product);

const defaultVariant =
product.variants?.find((variant) => variant.is_default) ??
product.variants?.[0];

return ( <article className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(7,21,29,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(7,21,29,0.12)]"> <div className="relative aspect-square overflow-hidden bg-[var(--surface-muted)]">
{image ? (
<img
src={image}
alt={
product.primary_image?.alt_text ||
product.name
}
className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]"
/>
) : ( <div className="flex h-full w-full items-center justify-center"> <div className="text-center"> <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-2xl text-[var(--primary)]">
G </div> <p className="text-sm text-[var(--muted)]">
No image available </p> </div> </div>
)}

    {product.is_featured && (
      <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white shadow-lg">
        Featured
      </span>
    )}
  </div>

  <div className="p-5">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
        {product.category?.name || "Product"}
      </span>

      {product.brand && (
        <span className="truncate text-xs text-[var(--muted)]">
          {product.brand}
        </span>
      )}
    </div>

    <h2 className="line-clamp-2 text-lg font-bold tracking-[-0.02em] text-[var(--heading)]">
      {product.name}
    </h2>

    {product.short_description && (
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
        {product.short_description}
      </p>
    )}

    <div className="mt-5 flex items-end justify-between gap-4">
      <div>
        {defaultVariant ? (
          <>
            <p className="text-lg font-bold text-[var(--heading)]">
              {formatPrice(defaultVariant.price)}
            </p>

            {defaultVariant.compare_at_price && (
              <p className="text-xs text-[var(--muted-light)] line-through">
                {formatPrice(
                  defaultVariant.compare_at_price
                )}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Price unavailable
          </p>
        )}
      </div>

      <a
        href={`/products/${product.slug}`}
        className="inline-flex h-10 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primaryDeep)]"
      >
        View
      </a>
    </div>
  </div>
</article>


);
}

function ProductSkeleton() {
return ( <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]"> <div className="aspect-square animate-pulse bg-[var(--surface-muted)]" />


  <div className="space-y-3 p-5">
    <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
    <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--surface-muted)]" />
    <div className="h-4 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
    <div className="h-10 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
  </div>
</div>

);
}

export default function ProductsPage() {
const searchParams = useSearchParams();
const router = useRouter();

const categoryFromUrl =
searchParams.get("category") || "";

const searchFromUrl =
searchParams.get("search") || "";

const [products, setProducts] = useState<Product[]>([]);
const [categories, setCategories] = useState<Category[]>([]);

const [count, setCount] = useState(0);
const [currentPage, setCurrentPage] = useState(1);

const [search, setSearch] =
useState(searchFromUrl);

const [category, setCategory] =
useState(categoryFromUrl);

const [ordering, setOrdering] =
useState("");

const [featured, setFeatured] =
useState(false);

const [loading, setLoading] =
useState(true);

const [categoriesLoading, setCategoriesLoading] =
useState(true);

const [error, setError] =
useState<string | null>(null);

const [categoriesError, setCategoriesError] =
useState<string | null>(null);

const pageSize = 12;

const totalPages = useMemo(() => {
return Math.max(1, Math.ceil(count / pageSize));
}, [count]);

const loadProducts = useCallback(async () => {
try {
setLoading(true);
setError(null);


  const response = await getProducts({
    category: category || undefined,
    search: search || undefined,
    ordering: ordering || undefined,
    featured: featured ? true : undefined,
    page: currentPage,
  });

  setProducts(response.results);
  setCount(response.count);
} catch (err) {
  console.error("Failed to load products:", err);
  setError(
    "We couldn't load the products right now."
  );
} finally {
  setLoading(false);
}


}, [
category,
search,
ordering,
featured,
currentPage,
]);

useEffect(() => {
loadProducts();
}, [loadProducts]);

useEffect(() => {
let mounted = true;

async function loadCategories() {
  try {
    setCategoriesLoading(true);
    setCategoriesError(null);

    const response = await getCategories();

    if (mounted) {
      setCategories(response.results);
    }
  } catch (err) {
    console.error(
      "Failed to load categories:",
      err
    );

    if (mounted) {
      setCategoriesError(
        "Unable to load categories."
      );
    }
  } finally {
    if (mounted) {
      setCategoriesLoading(false);
    }
  }
}

loadCategories();

return () => {
  mounted = false;
};

}, []);

useEffect(() => {
setSearch(searchFromUrl);
setCategory(categoryFromUrl);
setCurrentPage(1);
}, [searchFromUrl, categoryFromUrl]);

function handleSearch(event: FormEvent<HTMLFormElement>) {
event.preventDefault();


const params = new URLSearchParams();

if (search.trim()) {
  params.set("search", search.trim());
}

if (category) {
  params.set("category", category);
}

router.push(
  `/products${
    params.toString()
      ? `?${params.toString()}`
      : ""
  }`
);
}

function handleCategoryChange(
value: string
) {
setCategory(value);
setCurrentPage(1);


const params = new URLSearchParams();

if (value) {
  params.set("category", value);
}

if (search.trim()) {
  params.set("search", search.trim());
}

router.push(
  `/products${
    params.toString()
      ? `?${params.toString()}`
      : ""
  }`
);
}

function clearFilters() {
setSearch("");
setCategory("");
setOrdering("");
setFeatured(false);
setCurrentPage(1);

router.push("/products");


}

return ( <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"> <section className="relative overflow-hidden border-b border-[var(--border)]"> <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--primaryGlow)]/10 blur-3xl" />
    <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] shadow-sm">
          G-BYT Store
        </span>

        <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.045em] text-[var(--heading)] sm:text-5xl lg:text-6xl">
          Products built around
          <span className="block text-[var(--primary)]">
            better everyday living.
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
          Explore our collection of carefully
          selected products, publications and
          everyday essentials.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="mt-10 flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)]/80 p-3 shadow-[0_15px_45px_rgba(7,21,29,0.08)] backdrop-blur-xl sm:flex-row"
      >
        <div className="flex min-h-12 flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mr-3 h-5 w-5 text-[var(--muted)]"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />
            <path d="m20 20-4-4" />
          </svg>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-light)]"
          />
        </div>

        <button
          type="submit"
          className="min-h-12 rounded-xl bg-[var(--primary)] px-7 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primaryDeep)]"
        >
          Search
        </button>
      </form>
    </div>
  </section>

  <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_10px_30px_rgba(7,21,29,0.05)] lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--heading)]">
            Filters
          </h2>

          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            Clear
          </button>
        </div>

        <div className="mt-6">
          <label
            htmlFor="category"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]"
          >
            Category
          </label>

          <select
            id="category"
            value={category}
            onChange={(event) =>
              handleCategoryChange(
                event.target.value
              )
            }
            disabled={categoriesLoading}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">
              All categories
            </option>

            {categories.map((item) => (
              <option
                key={item.id}
                value={item.slug}
              >
                {item.name}
              </option>
            ))}
          </select>

          {categoriesError && (
            <p className="mt-2 text-xs text-[var(--danger)]">
              {categoriesError}
            </p>
          )}
        </div>

        <div className="mt-6">
          <label
            htmlFor="ordering"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]"
          >
            Sort by
          </label>

          <select
            id="ordering"
            value={ordering}
            onChange={(event) => {
              setOrdering(event.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">
              Recommended
            </option>
            <option value="newest">
              Newest
            </option>
            <option value="oldest">
              Oldest
            </option>
            <option value="name">
              Name A–Z
            </option>
            <option value="-name">
              Name Z–A
            </option>
          </select>
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => {
              setFeatured(event.target.checked);
              setCurrentPage(1);
            }}
            className="h-4 w-4 accent-[var(--primary)]"
          />

          <span className="text-sm font-medium text-[var(--foreground)]">
            Featured products only
          </span>
        </label>
      </aside>

      <div>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-[var(--muted)]">
              {loading
                ? "Loading products..."
                : `${count} product${
                    count === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          {(category ||
            search ||
            featured) && (
            <div className="flex flex-wrap gap-2">
              {category && (
                <span className="rounded-full bg-[var(--primarySoft)] px-3 py-1 text-xs font-semibold text-[var(--primaryDeep)]">
                  Category: {category}
                </span>
              )}

              {search && (
                <span className="rounded-full bg-[var(--primarySoft)] px-3 py-1 text-xs font-semibold text-[var(--primaryDeep)]">
                  Search: {search}
                </span>
              )}

              {featured && (
                <span className="rounded-full bg-[var(--primarySoft)] px-3 py-1 text-xs font-semibold text-[var(--primaryDeep)]">
                  Featured
                </span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[var(--dangerSoft)] p-8 text-center">
            <h2 className="font-bold text-[var(--heading)]">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProducts}
              className="mt-5 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <ProductSkeleton
                  key={index}
                />
              )
            )}
          </div>
        )}

        {!error &&
          !loading &&
          products.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-[var(--borderStrong)] bg-[var(--surface)] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primarySoft)] text-2xl font-bold text-[var(--primary)]">
                G
              </div>

              <h2 className="mt-5 text-xl font-bold text-[var(--heading)]">
                No products found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Try changing your search or
                removing one of the filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Clear filters
              </button>
            </div>
          )}

        {!error &&
          !loading &&
          products.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage >= totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  </section>
</main>


);
}
