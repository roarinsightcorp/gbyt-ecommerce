"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
Archive,
ChevronLeft,
ChevronRight,
Eye,
Filter,
LayoutGrid,
List,
Package,
Pencil,
Plus,
RefreshCw,
Search,
Star,
Tag,
X,
} from "lucide-react";
import { apiGet } from "@/lib/api/client";

type Category = {
id: number;
name: string;
slug: string;
};

type Product = {
id: number;
name: string;
slug: string;
short_description?: string;
category?: Category | null;
brand?: string;
product_type: "PHYSICAL" | "DIGITAL" | "HYBRID";
status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
is_featured: boolean;
is_active: boolean;
has_physical_item: boolean;
has_digital_item: boolean;
variant_count: number;
created_at: string;
updated_at: string;
};

type ProductResponse = {
count?: number;
next?: string | null;
previous?: string | null;
results?: Product[];
};

type ViewMode = "table" | "grid";

type Filters = {
status: string;
product_type: string;
active: string;
featured: string;
};

const DEFAULT_FILTERS: Filters = {
status: "",
product_type: "",
active: "",
featured: "",
};

function buildProductUrl(slug: string) {
return `/admin/products/${encodeURIComponent(slug)}`;
}

function normalizeResponse(response: ProductResponse): ProductResponse {
return {
count: response.count ?? 0,
next: response.next ?? null,
previous: response.previous ?? null,
results: response.results ?? [],
};
}

export default function AdminProductsPage() {
const [data, setData] = useState<ProductResponse>({
results: [],
count: 0,
next: null,
previous: null,
});

const [search, setSearch] = useState("");
const [filters, setFilters] =
useState<Filters>(DEFAULT_FILTERS);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [viewMode, setViewMode] =
useState<ViewMode>("table");

const [page, setPage] = useState(1);

const requestSequence = useRef(0);

const load = useCallback(
async ({
pageNumber = 1,
searchValue = search,
filterValues = filters,
}: {
pageNumber?: number;
searchValue?: string;
filterValues?: Filters;
} = {}) => {
const requestId = ++requestSequence.current;

  try {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    const trimmedSearch = searchValue.trim();

    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }

    if (filterValues.status) {
      params.set("status", filterValues.status);
    }

    if (filterValues.product_type) {
      params.set(
        "product_type",
        filterValues.product_type,
      );
    }

    if (filterValues.active) {
      params.set("active", filterValues.active);
    }

    if (filterValues.featured) {
      params.set(
        "featured",
        filterValues.featured,
      );
    }

    params.set("page", String(pageNumber));

    const response =
      await apiGet<ProductResponse>(
        `/admin/products/?${params.toString()}`,
        true,
      );

    if (
      requestId !== requestSequence.current
    ) {
      return;
    }

    setData(normalizeResponse(response));
    setPage(pageNumber);
  } catch (requestError) {
    if (
      requestId !== requestSequence.current
    ) {
      return;
    }

    setError(
      requestError instanceof Error
        ? requestError.message
        : "We couldn't load the product catalogue. Please try again.",
    );
  } finally {
    if (
      requestId === requestSequence.current
    ) {
      setLoading(false);
    }
  }
},
[filters, search],


);

useEffect(() => {
void load({
pageNumber: 1,
searchValue: "",
filterValues: DEFAULT_FILTERS,
});


// Initial load intentionally uses explicit initial values.
// eslint-disable-next-line react-hooks/exhaustive-deps


}, []);

const products = data.results ?? [];
const totalProducts = data.count ?? 0;

const activeProducts = products.filter(
(product) => product.status === "ACTIVE",
).length;

const featuredProducts = products.filter(
(product) => product.is_featured,
).length;

const totalVariants = products.reduce(
(total, product) =>
total + Number(product.variant_count || 0),
0,
);

const hasFilters =
Boolean(search.trim()) ||
Object.values(filters).some(Boolean);

function updateFilter(
key: keyof Filters,
value: string,
) {
const nextFilters = {
...filters,
[key]: value,
};


setFilters(nextFilters);
setPage(1);

void load({
  pageNumber: 1,
  searchValue: search,
  filterValues: nextFilters,
});


}

function clearFilters() {
const clearedFilters = {
...DEFAULT_FILTERS,
};


setSearch("");
setFilters(clearedFilters);
setPage(1);

void load({
  pageNumber: 1,
  searchValue: "",
  filterValues: clearedFilters,
});


}

function handleSearch(
event: React.FormEvent<HTMLFormElement>,
) {
event.preventDefault();


const normalizedSearch = search.trim();

setSearch(normalizedSearch);
setPage(1);

void load({
  pageNumber: 1,
  searchValue: normalizedSearch,
  filterValues: filters,
});


}

function refreshCurrentPage() {
void load({
pageNumber: page,
searchValue: search,
filterValues: filters,
});
}

function goToPreviousPage() {
if (
page <= 1 ||
!data.previous
) {
return;
}

void load({
  pageNumber: page - 1,
  searchValue: search,
  filterValues: filters,
});


}

function goToNextPage() {
if (!data.next) {
return;
}


void load({
  pageNumber: page + 1,
  searchValue: search,
  filterValues: filters,
});


}

return ( <div className="space-y-6"> 
  <Header
     onRefresh={refreshCurrentPage}
     loading={loading}
   />


  <Stats
    total={totalProducts}
    active={activeProducts}
    featured={featuredProducts}
    variants={totalVariants}
  />

  <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
    <div className="border-b border-white/[0.07] p-4">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 lg:flex-row"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            size={17}
            aria-hidden="true"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products by name, brand or description..."
            aria-label="Search products"
            className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#0786AD]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0786AD] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#05647F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search size={16} />
          Search
        </button>

        <Link
          href="/admin/products/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0786AD]/40 bg-[#0786AD]/10 px-5 py-2.5 text-sm font-semibold text-[#7DE8FA] transition hover:bg-[#0786AD]/20"
        >
          <Plus size={17} />
          Add product
        </Link>
      </form>

      <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter
            size={16}
            className="mr-1 text-white/35"
            aria-hidden="true"
          />

          <FilterSelect
            value={filters.status}
            onChange={(value) =>
              updateFilter("status", value)
            }
            options={[
              {
                label: "All statuses",
                value: "",
              },
              {
                label: "Active",
                value: "ACTIVE",
              },
              {
                label: "Draft",
                value: "DRAFT",
              },
              {
                label: "Inactive",
                value: "INACTIVE",
              },
              {
                label: "Archived",
                value: "ARCHIVED",
              },
            ]}
          />

          <FilterSelect
            value={filters.product_type}
            onChange={(value) =>
              updateFilter(
                "product_type",
                value,
              )
            }
            options={[
              {
                label: "All product types",
                value: "",
              },
              {
                label: "Physical",
                value: "PHYSICAL",
              },
              {
                label: "Digital",
                value: "DIGITAL",
              },
              {
                label: "Hybrid",
                value: "HYBRID",
              },
            ]}
          />

          <FilterSelect
            value={filters.active}
            onChange={(value) =>
              updateFilter("active", value)
            }
            options={[
              {
                label: "All visibility",
                value: "",
              },
              {
                label: "Visible",
                value: "true",
              },
              {
                label: "Hidden",
                value: "false",
              },
            ]}
          />

          <FilterSelect
            value={filters.featured}
            onChange={(value) =>
              updateFilter("featured", value)
            }
            options={[
              {
                label: "All products",
                value: "",
              },
              {
                label: "Featured",
                value: "true",
              },
              {
                label: "Not featured",
                value: "false",
              },
            ]}
          />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/50 transition hover:bg-white/[0.05] hover:text-white"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-1 self-start rounded-xl border border-white/10 bg-black/10 p-1"
          role="group"
          aria-label="Product view"
        >
          <ViewButton
            active={viewMode === "table"}
            label="Table view"
            onClick={() =>
              setViewMode("table")
            }
          >
            <List size={16} />
          </ViewButton>

          <ViewButton
            active={viewMode === "grid"}
            label="Grid view"
            onClick={() =>
              setViewMode("grid")
            }
          >
            <LayoutGrid size={16} />
          </ViewButton>
        </div>
      </div>
    </div>

    {error && (
      <div className="m-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
        <div className="flex items-center justify-between gap-4">
          <span>{error}</span>

          <button
            type="button"
            onClick={refreshCurrentPage}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-400/10"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      </div>
    )}

    {loading ? (
      <LoadingState />
    ) : products.length === 0 ? (
      <EmptyState
        filtered={hasFilters}
        onClear={clearFilters}
      />
    ) : viewMode === "table" ? (
      <ProductTable products={products} />
    ) : (
      <ProductGrid products={products} />
    )}

    {!loading && products.length > 0 && (
      <Pagination
        count={totalProducts}
        page={page}
        hasNext={Boolean(data.next)}
        hasPrevious={Boolean(data.previous)}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />
    )}
  </section>
</div>
);
}

function Header({
onRefresh,
loading,
}: {
onRefresh: () => void;
loading: boolean;
}) {
return ( <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"> <div> <div className="flex items-center gap-2"> <div className="rounded-xl border border-[#0786AD]/20 bg-[#0786AD]/10 p-2 text-[#39D5F2]"> <Package size={19} /> </div>


      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Products
        </h1>

        <p className="mt-1 text-sm text-white/40">
          Manage your catalogue, publishing, variants and
          product configuration.
        </p>
      </div>
    </div>
  </div>

  <button
    type="button"
    onClick={onRefresh}
    disabled={loading}
    className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
  >
    <RefreshCw
      size={16}
      className={loading ? "animate-spin" : ""}
    />
    Refresh
  </button>
</div>


);
}

function Stats({
total,
active,
featured,
variants,
}: {
total: number;
active: number;
featured: number;
variants: number;
}) {
return ( <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
<Stat
label="Total products"
value={total}
icon={<Package size={18} />}
/>


  <Stat
    label="Active products"
    value={active}
    icon={<Eye size={18} />}
  />

  <Stat
    label="Featured"
    value={featured}
    icon={<Star size={18} />}
  />

  <Stat
    label="Total variants"
    value={variants}
    icon={<Tag size={18} />}
  />
</div>


);
}

function Stat({
label,
value,
icon,
}: {
label: string;
value: number;
icon: React.ReactNode;
}) {
return ( <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.04]"> <div className="flex items-center justify-between text-white/40"> <span className="text-sm">{label}</span>


    {icon}
  </div>

  <div className="mt-3 text-2xl font-bold tracking-tight">
    {value.toLocaleString("en-NG")}
  </div>
</div>


);
}

function FilterSelect({
value,
onChange,
options,
}: {
value: string;
onChange: (value: string) => void;
options: Array<{
label: string;
value: string;
}>;
}) {
return (
<select
value={value}
onChange={(event) =>
onChange(event.target.value)
}
aria-label="Product filter"
className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70 outline-none transition focus:border-[#0786AD]"
>
{options.map((option) => (
<option
key={option.value || "all"}
value={option.value}
className="bg-[#081117] text-white"
>
{option.label} </option>
))} </select>
);
}

function ViewButton({
active,
label,
onClick,
children,
}: {
active: boolean;
label: string;
onClick: () => void;
children: React.ReactNode;
}) {
return (
<button
type="button"
title={label}
aria-label={label}
aria-pressed={active}
onClick={onClick}
className={`rounded-lg p-2 transition ${
        active
          ? "bg-[#0786AD]/20 text-[#39D5F2]"
          : "text-white/35 hover:bg-white/[0.05] hover:text-white/70"
      }`}
>
{children} </button>
);
}

function ProductTable({
products,
}: {
products: Product[];
}) {
return ( 
  <div className="overflow-x-auto"> 
    <table className="w-full min-w-[900px] text-left"> 
      <thead> 
        <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/30"> 
          <th className="px-5 py-3 font-medium">
            Product 
          </th>

          <th className="px-5 py-3 font-medium">
            Category
          </th>

          <th className="px-5 py-3 font-medium">
            Type
          </th>

          <th className="px-5 py-3 font-medium">
            Variants
          </th>

          <th className="px-5 py-3 font-medium">
            Status
          </th>

          <th className="px-5 py-3 text-right font-medium">
            Action
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-white/[0.06]">
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
          />
        ))}
      </tbody>
    </table>
  </div>
);
}

function ProductRow({
product,
}: {
product: Product;
}) {
const productUrl = buildProductUrl(
product.slug,
);

return ( <tr className="group transition hover:bg-white/[0.025]"> <td className="px-5 py-4"> <div className="flex min-w-[280px] items-center gap-3"> <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/30"> <Package size={18} /> </div>


      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={productUrl}
            className="truncate font-medium text-white transition hover:text-[#39D5F2]"
          >
            {product.name}
          </Link>

          {product.is_featured && (
            <Star
              size={13}
              className="shrink-0 fill-current text-[#39D5F2]"
              aria-label="Featured product"
            />
          )}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-white/35">
          <span>#{product.id}</span>

          {product.brand && (
            <>
              <span aria-hidden="true">
                ·
              </span>

              <span>{product.brand}</span>
            </>
          )}
        </div>
      </div>
    </div>
  </td>

  <td className="px-5 py-4">
    <span className="text-sm text-white/65">
      {product.category?.name ||
        "Uncategorised"}
    </span>
  </td>

  <td className="px-5 py-4">
    <ProductTypeBadge
      type={product.product_type}
    />
  </td>

  <td className="px-5 py-4">
    <div className="text-sm font-medium">
      {Number(
        product.variant_count || 0,
      ).toLocaleString("en-NG")}
    </div>

    <div className="mt-0.5 text-xs text-white/30">
      {Number(product.variant_count || 0) ===
      1
        ? "variant"
        : "variants"}
    </div>
  </td>

  <td className="px-5 py-4">
    <StatusBadge status={product.status} />
  </td>

  <td className="px-5 py-4 text-right">
    <Link
      href={productUrl}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-[#0786AD]/40 hover:bg-[#0786AD]/10 hover:text-[#7DE8FA]"
    >
      <Pencil size={14} />
      Manage
    </Link>
  </td>
</tr>


);
}

function ProductGrid({
products,
}: {
products: Product[];
}) {
return ( <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
{products.map((product) => {
const productUrl = buildProductUrl(
product.slug,
);


    return (
      <Link
        key={product.id}
        href={productUrl}
        className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-[#0786AD]/30 hover:bg-white/[0.04]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/30">
            <Package size={18} />
          </div>

          <StatusBadge
            status={product.status}
          />
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold group-hover:text-[#39D5F2]">
              {product.name}
            </h2>

            {product.is_featured && (
              <Star
                size={13}
                className="shrink-0 fill-current text-[#39D5F2]"
                aria-label="Featured product"
              />
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/40">
            {product.short_description ||
              "No short description provided."}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ProductTypeBadge
            type={product.product_type}
          />

          <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-xs text-white/45">
            {Number(
              product.variant_count || 0,
            )}{" "}
            {Number(
              product.variant_count || 0,
            ) === 1
              ? "variant"
              : "variants"}
          </span>
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4 text-xs text-white/35">
          {product.category?.name ||
            "Uncategorised"}
        </div>
      </Link>
    );
  })}
</div>


);
}


function StatusBadge({
  status,
}: {
  status: Product["status"];
}) {
  const styles: Record<Product["status"], string> = {
    ACTIVE:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    DRAFT:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",
    INACTIVE:
      "border-white/10 bg-white/[0.04] text-white/45",
    ARCHIVED:
      "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function ProductTypeBadge({
  type,
}: {
  type: Product["product_type"];
}) {
  const labels: Record<Product["product_type"], string> = {
    PHYSICAL: "Physical",
    DIGITAL: "Digital",
    HYBRID: "Hybrid",
  };

  return (
    <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/70">
      {labels[type]}
    </span>
  );
}



function LoadingState() {
return ( <div
   className="space-y-px p-4"
   aria-label="Loading products"
   aria-busy="true"
 >
{[1, 2, 3, 4, 5].map(
(item) => ( <div
         key={item}
         className="h-[72px] animate-pulse rounded-xl bg-white/[0.035]"
       />
),
)} </div>
);
}

function EmptyState({
filtered,
onClear,
}: {
filtered: boolean;
onClear: () => void;
}) {
return ( <div className="px-6 py-16 text-center">
{filtered ? ( <Archive
       className="mx-auto text-white/20"
       size={38}
       aria-hidden="true"
     />
) : ( <Package
       className="mx-auto text-white/20"
       size={38}
       aria-hidden="true"
     />
)}


  <h2 className="mt-4 font-semibold">
    {filtered
      ? "No matching products"
      : "No products yet"}
  </h2>

  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
    {filtered
      ? "Try changing your search or filters to find the products you're looking for."
      : "Create your first product to begin building the G-BYT catalogue."}
  </p>

  {filtered ? (
    <button
      type="button"
      onClick={onClear}
      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.05] hover:text-white"
    >
      <X size={15} />
      Clear filters
    </button>
  ) : (
    <Link
      href="/admin/products/create"
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0786AD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#05647F]"
    >
      <Plus size={16} />
      Create product
    </Link>
  )}
</div>

);
}

function Pagination({
count,
page,
hasNext,
hasPrevious,
onPrevious,
onNext,
}: {
count: number;
page: number;
hasNext: boolean;
hasPrevious: boolean;
onPrevious: () => void;
onNext: () => void;
}) {
return ( <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"> <p className="text-xs text-white/35">
{count.toLocaleString("en-NG")}{" "}
{count === 1
? "product"
: "products"}{" "}
in catalogue </p>

  <div
    className="flex items-center gap-2"
    aria-label="Product pagination"
  >
    <button
      type="button"
      disabled={!hasPrevious}
      onClick={onPrevious}
      aria-label="Previous product page"
      className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
    >
      <ChevronLeft size={14} />
      Previous
    </button>

    <span
      className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-white/45"
      aria-current="page"
    >
      Page {page}
    </span>

    <button
      type="button"
      disabled={!hasNext}
      onClick={onNext}
      aria-label="Next product page"
      className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
    >
      Next
      <ChevronRight size={14} />
    </button>
  </div>
</div>


);
}
