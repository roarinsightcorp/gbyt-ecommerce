"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUp,
  Boxes,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Warehouse,
} from "lucide-react";
import { apiGet } from "@/lib/api/client";

type InventoryItem = {
  id: number;
  variant: number;
  sku: string;
  product_name: string;
  location: number;
  location_name: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_level: number;
  is_low_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type InventoryLocation = {
  id: number;
  name: string;
  code: string;
  location_type: string;
  city?: string;
  state?: string;
  country?: string;
  is_active: boolean;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type InventoryResponse = PaginatedResponse<InventoryItem>;
type LocationResponse = InventoryLocation[] | PaginatedResponse<InventoryLocation>;

const EMPTY_RESPONSE: InventoryResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

function normalizePage<T>(
  response: T[] | PaginatedResponse<T>,
): PaginatedResponse<T> {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      next: null,
      previous: null,
      results: response,
    };
  }

  return {
    count: response.count ?? 0,
    next: response.next ?? null,
    previous: response.previous ?? null,
    results: response.results ?? [],
  };
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse>(EMPTY_RESPONSE);
  const [appliedFilters, setAppliedFilters] = useState({
    sku: "",
    location: "",
    lowStockOnly: false,
    });
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [sku, setSku] = useState("");
  const [location, setLocation] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");

  const load = useCallback(
    async (pageNumber = 1) => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (appliedFilters.sku) {
        params.set("sku", appliedFilters.sku);
        }

        if (appliedFilters.location) {
        params.set("location", appliedFilters.location);
        }

        if (appliedFilters.lowStockOnly) {
        params.set("low_stock", "true");
        }

        params.set("page", String(pageNumber));


        const response = await apiGet<InventoryResponse>(
          `/inventory/items/?${params.toString()}`,
          true,
        );

        setData(normalizePage(response));
        setPage(pageNumber);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  const loadLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      setLocationError("");

      const response = await apiGet<LocationResponse>(
        "/inventory/locations/",
        true,
      );

      const normalized = normalizePage(response);
      setLocations(normalized.results.filter((item) => item.is_active));
    } catch (err) {
      setLocationError(getErrorMessage(err));
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  const loadLowStockCount = useCallback(async () => {
    try {
      const response = await apiGet<InventoryResponse>(
        "/inventory/items/?low_stock=true",
        true,
      );

      setLowStockCount(normalizePage(response).count);
    } catch {
      // The main inventory list remains usable if this secondary
      // statistics request fails.
    }
  }, []);

  useEffect(() => {
    // Initial API loading is intentionally triggered when this page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void loadLocations();
    void loadLowStockCount();
  }, [load, loadLocations, loadLowStockCount]);

  const rows = data.results;
  const availableOnPage = rows.reduce(
    (total, item) => total + Number(item.available_quantity || 0),
    0,
  );
  const reservedOnPage = rows.reduce(
    (total, item) => total + Number(item.reserved_quantity || 0),
    0,
  );

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);

    setAppliedFilters({
        sku: sku.trim(),
        location,
        lowStockOnly,
    });
    }

  function clearFilters() {
    setSku("");
    setLocation("");
    setLowStockOnly(false);
    setPage(1);
    setAppliedFilters({
        sku: "",
        location: "",
        lowStockOnly: false,
    });
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#39D5F2]">
            <Warehouse size={14} />
            Operations
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Monitor physical stock, reservations, availability and reorder
            levels.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void load(page);
            void loadLowStockCount();
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/75 transition hover:border-[#39D5F2]/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => void load(page)}
            className="font-semibold text-red-100 underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Inventory records"
          value={formatNumber(data.count)}
          detail="Matching records"
          icon={<Boxes size={19} />}
        />
        <StatCard
          label="Low-stock records"
          value={formatNumber(lowStockCount)}
          detail="Across all matching records"
          icon={<AlertTriangle size={19} />}
          warning={lowStockCount > 0}
        />
        <StatCard
          label="Available units"
          value={formatNumber(availableOnPage)}
          detail="Current page only"
          icon={<Package size={19} />}
        />
        <StatCard
          label="Reserved units"
          value={formatNumber(reservedOnPage)}
          detail="Current page only"
          icon={<ArrowUp size={19} />}
        />
      </div>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-white">Find inventory</h2>
          <p className="mt-1 text-xs text-white/40">
            SKU filtering uses an exact match. Location and low-stock filters
            are applied by the server.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(190px,0.65fr)_auto_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="Enter exact SKU..."
              aria-label="Exact SKU"
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#39D5F2]/50"
            />
          </div>

          <div className="relative">
            <MapPin
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={locationsLoading}
              aria-label="Filter by location"
              className="w-full appearance-none rounded-xl border border-white/10 bg-[#111820] py-3 pl-9 pr-3 text-sm text-white outline-none focus:border-[#39D5F2]/50 disabled:opacity-50"
            >
              <option value="">All locations</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.code ? ` (${item.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => setLowStockOnly(event.target.checked)}
              className="accent-[#12B8DC]"
            />
            Low stock only
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#0786AD] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0799C4] disabled:opacity-50"
          >
            Apply filters
          </button>
        </form>

        {locationError && (
          <p className="mt-3 text-xs text-amber-300">
            Locations could not be loaded: {locationError}
          </p>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-white/40 transition hover:text-[#39D5F2]"
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
        <div className="flex flex-col justify-between gap-2 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">Stock ledger</h2>
            <p className="mt-1 text-xs text-white/40">
              {formatNumber(data.count)} matching inventory records
            </p>
          </div>
          <span className="text-xs text-white/35">
            {rows.length ? `Showing ${rows.length} on this page` : " "}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-[68px] animate-pulse rounded-xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/30">
              <Boxes size={25} />
            </div>
            <h3 className="mt-4 font-semibold text-white">
              No inventory records found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
              There are no records matching these filters. Try another SKU,
              location or stock filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 text-sm font-semibold text-[#39D5F2] hover:text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_0.8fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-white/[0.06] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/35 lg:grid">
              <span>Product / SKU</span>
              <span>On hand</span>
              <span>Reserved</span>
              <span>Available</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-white/[0.055]">
              {rows.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inventory/${item.id}`}
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] lg:grid-cols-[minmax(0,2fr)_0.8fr_0.8fr_0.8fr_0.8fr] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">
                      {item.product_name || "Unnamed product"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/40">
                      <span>{item.sku || `Variant #${item.variant}`}</span>
                      <span className="text-white/20">Â·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} />
                        {item.location_name || "Unknown location"}
                      </span>
                    </div>
                  </div>

                  <QuantityCell
                    label="On hand"
                    value={item.quantity}
                  />
                  <QuantityCell
                    label="Reserved"
                    value={item.reserved_quantity}
                  />
                  <QuantityCell
                    label="Available"
                    value={item.available_quantity}
                    highlight={item.is_low_stock}
                  />

                  <div className="flex items-center justify-between gap-3 lg:block">
                    <span className="text-xs text-white/35 lg:hidden">
                      Stock status
                    </span>
                    {item.is_low_stock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-2.5 py-1 text-xs font-medium text-amber-300">
                        <AlertTriangle size={12} />
                        Low stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-xs font-medium text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        In stock
                      </span>
                    )}
                    <div className="mt-1 text-[11px] text-white/30">
                      Reorder at {formatNumber(item.reorder_level)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-xs text-white/40">
                Page {page} Â· {formatNumber(data.count)} total records
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!data.previous || loading}
                  onClick={() => void load(page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!data.next || loading}
                  onClick={() => void load(page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex items-start gap-2 text-xs leading-relaxed text-white/35">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <p>
          Available stock is physical quantity minus reserved quantity.
          Inventory figures on the summary cards are calculated from the
          currently displayed page unless explicitly labelled as matching
          records.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  warning = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-white/45">{label}</span>
        <span
          className={`flex size-9 items-center justify-center rounded-xl border ${
            warning
              ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
              : "border-[#39D5F2]/15 bg-[#39D5F2]/[0.07] text-[#39D5F2]"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-white">
        {value}
      </div>
      <p className="mt-1 text-xs text-white/35">{detail}</p>
    </div>
  );
}

function QuantityCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between lg:block">
      <span className="text-xs text-white/35 lg:hidden">{label}</span>
      <div
        className={`text-sm font-semibold tabular-nums ${
          highlight ? "text-amber-300" : "text-white/80"
        }`}
      >
        {formatNumber(value)}
      </div>
    </div>
  );
}
