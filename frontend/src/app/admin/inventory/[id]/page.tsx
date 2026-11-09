"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  ClipboardList,
  History,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Warehouse,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api/client";

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

type InventoryMovement = {
  id: number;
  inventory_item: number;
  sku: string;
  movement_type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "RESERVATION" | "RELEASE";
  quantity: number;
  reference: string;
  notes: string;
  performed_by: number | null;
  created_at: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type OperationType = "receive" | "remove" | "reserve" | "release" | "adjust";

type OperationResponse = {
  inventory: InventoryItem;
  movement: InventoryMovement | null;
};

type OperationConfig = {
  title: string;
  description: string;
  quantityLabel: string;
  submitLabel: string;
  endpoint: string;
  icon: React.ReactNode;
  tone: string;
};

const OPERATIONS: Record<OperationType, OperationConfig> = {
  receive: {
    title: "Receive stock",
    description: "Add newly received physical units to this inventory item.",
    quantityLabel: "Quantity to receive",
    submitLabel: "Receive stock",
    endpoint: "/inventory/receive/",
    icon: <ArrowDownToLine size={17} />,
    tone: "emerald",
  },
  remove: {
    title: "Remove stock",
    description: "Remove physical units. You cannot remove reserved stock.",
    quantityLabel: "Quantity to remove",
    submitLabel: "Remove stock",
    endpoint: "/inventory/remove/",
    icon: <ArrowUpFromLine size={17} />,
    tone: "red",
  },
  reserve: {
    title: "Reserve stock",
    description:
      "Set aside available units. This does not reduce physical quantity.",
    quantityLabel: "Quantity to reserve",
    submitLabel: "Reserve stock",
    endpoint: "/inventory/reserve/",
    icon: <ClipboardList size={17} />,
    tone: "amber",
  },
  release: {
    title: "Release reservation",
    description: "Return reserved units to available stock.",
    quantityLabel: "Quantity to release",
    submitLabel: "Release reservation",
    endpoint: "/inventory/release/",
    icon: <RotateCcw size={17} />,
    tone: "cyan",
  },
  adjust: {
    title: "Adjust physical stock",
    description:
      "Set the exact physical quantity after a stock count. This is not an increase/decrease amount, and it cannot be lower than reserved stock.",
    quantityLabel: "New physical quantity",
    submitLabel: "Save adjustment",
    endpoint: "/inventory/adjust/",
    icon: <SlidersHorizontal size={17} />,
    tone: "violet",
  },
};

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value: string) {
  if (!value) return "â€”";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â€”";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function movementLabel(type: InventoryMovement["movement_type"]) {
  const labels: Record<InventoryMovement["movement_type"], string> = {
    STOCK_IN: "Stock received",
    STOCK_OUT: "Stock removed",
    ADJUSTMENT: "Stock adjustment",
    RESERVATION: "Stock reserved",
    RELEASE: "Reservation released",
  };

  return labels[type] ?? type;
}

function movementColor(type: InventoryMovement["movement_type"]) {
  switch (type) {
    case "STOCK_IN":
    case "RELEASE":
      return "text-emerald-300";
    case "STOCK_OUT":
      return "text-red-300";
    case "RESERVATION":
      return "text-amber-300";
    default:
      return "text-[#39D5F2]";
  }
}

export default function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementCount, setMovementCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(true);
  const [error, setError] = useState("");
  const [movementError, setMovementError] = useState("");

  const [activeOperation, setActiveOperation] =
    useState<OperationType | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadItem = useCallback(async () => {
    if (!id || !/^\d+$/.test(id)) {
      setError("The inventory item ID is invalid.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiGet<InventoryItem>(
        `/inventory/items/${id}/`,
        true,
      );

      setItem(response);
    } catch (err) {
      setError(getErrorMessage(err));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMovements = useCallback(async () => {
    if (!id || !/^\d+$/.test(id)) return;

    try {
      setMovementLoading(true);
      setMovementError("");

      const response = await apiGet<PaginatedResponse<InventoryMovement>>(
        `/inventory/movements/?inventory_item=${encodeURIComponent(id)}`,
        true,
      );

      setMovements(response.results ?? []);
      setMovementCount(response.count ?? 0);
    } catch (err) {
      setMovementError(getErrorMessage(err));
    } finally {
      setMovementLoading(false);
    }
  }, [id]);

  const refresh = useCallback(async () => {
    await Promise.all([loadItem(), loadMovements()]);
  }, [loadItem, loadMovements]);

  useEffect(() => {
    // Initial API loading is intentionally triggered when this page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  function openOperation(type: OperationType) {
    setActiveOperation(type);
    setQuantity("");
    setReference("");
    setNotes("");
    setOperationError("");
    setSuccessMessage("");
  }

  function closeOperation() {
    if (submitting) return;

    setActiveOperation(null);
    setOperationError("");
  }

  async function submitOperation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!item || !activeOperation) return;

    const numericQuantity = Number(quantity);

    if (!Number.isInteger(numericQuantity) || numericQuantity < 0) {
      setOperationError("Enter a valid whole-number quantity.");
      return;
    }

    if (activeOperation !== "adjust" && numericQuantity < 1) {
      setOperationError("Quantity must be at least 1.");
      return;
    }

    if (activeOperation === "adjust" && numericQuantity < 0) {
      setOperationError("The new physical quantity cannot be negative.");
      return;
    }

    if (
      activeOperation === "remove" &&
      numericQuantity > item.available_quantity
    ) {
      setOperationError(
        `Only ${formatNumber(item.available_quantity)} units are available to remove.`,
      );
      return;
    }

    if (
      activeOperation === "reserve" &&
      numericQuantity > item.available_quantity
    ) {
      setOperationError(
        `Only ${formatNumber(item.available_quantity)} units are available to reserve.`,
      );
      return;
    }

    if (
      activeOperation === "release" &&
      numericQuantity > item.reserved_quantity
    ) {
      setOperationError(
        `Only ${formatNumber(item.reserved_quantity)} units are currently reserved.`,
      );
      return;
    }

    if (
      activeOperation === "adjust" &&
      numericQuantity < item.reserved_quantity
    ) {
      setOperationError(
        `New quantity cannot be below the ${formatNumber(item.reserved_quantity)} reserved units.`,
      );
      return;
    }

    const config = OPERATIONS[activeOperation];

    const confirmed = window.confirm(
      `${config.title}?\n\nProduct: ${item.product_name}\nSKU: ${item.sku}\n${
        activeOperation === "adjust"
          ? `New physical quantity: ${numericQuantity}`
          : `Quantity: ${numericQuantity}`
      }\n\nThis action will be recorded in the inventory movement history.`,
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      setOperationError("");
      setSuccessMessage("");

      const response = await apiPost<OperationResponse>(
        config.endpoint,
        {
          inventory_item: item.id,
          quantity: numericQuantity,
          reference: reference.trim(),
          notes: notes.trim(),
        },
        true,
      );

      if (response.inventory) {
        setItem(response.inventory);
      }

      setActiveOperation(null);
      setQuantity("");
      setReference("");
      setNotes("");
      setSuccessMessage(`${config.title} completed successfully.`);

      await loadMovements();
    } catch (err) {
      setOperationError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-5 w-36 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((value) => (
            <div
              key={value}
              className="h-28 animate-pulse rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-5">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 text-sm text-[#39D5F2] hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to inventory
        </Link>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6">
          <AlertTriangle size={24} className="text-red-300" />
          <h1 className="mt-3 text-lg font-semibold text-white">
            Inventory item unavailable
          </h1>
          <p className="mt-2 text-sm text-red-100/70">
            {error || "This inventory item could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void loadItem()}
            className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/[0.05]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 text-sm text-[#39D5F2] transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to inventory
          </Link>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#39D5F2]">
            <Warehouse size={14} />
            Inventory record #{item.id}
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {item.product_name || "Inventory item"}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/45">
            <span>SKU: {item.sku || "â€”"}</span>
            <span className="text-white/20">Â·</span>
            <span>{item.location_name || "Unknown location"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || submitting}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.06] disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Physical quantity"
          value={item.quantity}
          detail="Units physically in stock"
          icon={<Package size={18} />}
        />
        <MetricCard
          label="Reserved"
          value={item.reserved_quantity}
          detail="Units set aside"
          icon={<ClipboardList size={18} />}
        />
        <MetricCard
          label="Available"
          value={item.available_quantity}
          detail="Physical quantity less reserved"
          icon={<ArrowDownToLine size={18} />}
          warning={item.is_low_stock}
        />
        <MetricCard
          label="Reorder level"
          value={item.reorder_level}
          detail="Low-stock threshold"
          icon={<AlertTriangle size={18} />}
        />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">Stock operations</h2>
            <p className="mt-1 text-xs text-white/40">
              All operations are validated and recorded by the backend.
            </p>
          </div>
          {item.is_low_stock ? (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1.5 text-xs font-medium text-amber-300">
              <AlertTriangle size={13} />
              Low stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Stock healthy
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(OPERATIONS) as OperationType[]).map((type) => {
            const config = OPERATIONS[type];

            return (
              <button
                key={type}
                type="button"
                onClick={() => openOperation(type)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm font-medium text-white/75 transition hover:border-[#39D5F2]/30 hover:bg-[#39D5F2]/[0.05] hover:text-white"
              >
                {config.icon}
                {config.title}
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
        <div className="flex flex-col justify-between gap-2 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <History size={17} className="text-[#39D5F2]" />
            <div>
              <h2 className="font-semibold text-white">Movement history</h2>
              <p className="mt-1 text-xs text-white/40">
                {formatNumber(movementCount)} recorded movements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadMovements()}
            disabled={movementLoading}
            className="inline-flex items-center gap-2 self-start text-xs text-white/50 hover:text-white disabled:opacity-40"
          >
            <RefreshCw
              size={13}
              className={movementLoading ? "animate-spin" : ""}
            />
            Refresh history
          </button>
        </div>

        {movementError && (
          <div className="px-5 py-4 text-sm text-red-200">
            {movementError}
          </div>
        )}

        {movementLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((value) => (
              <div
                key={value}
                className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <History size={28} className="mx-auto text-white/20" />
            <h3 className="mt-3 font-semibold text-white">
              No movements recorded
            </h3>
            <p className="mt-1 text-sm text-white/40">
              Stock operations will appear here once recorded.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.055]">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_0.7fr_minmax(0,1.4fr)] sm:items-center"
              >
                <div>
                  <div
                    className={`text-sm font-semibold ${movementColor(movement.movement_type)}`}
                  >
                    {movementLabel(movement.movement_type)}
                  </div>
                  <div className="mt-1 text-xs text-white/35">
                    {formatDate(movement.created_at)}
                  </div>
                </div>

                <div className="text-sm font-semibold tabular-nums text-white">
                  {movement.quantity > 0 ? "+" : ""}
                  {formatNumber(movement.quantity)}
                  <span className="ml-1 text-xs font-normal text-white/35">
                    units
                  </span>
                </div>

                <div className="min-w-0">
                  {movement.reference && (
                    <div className="truncate text-xs text-white/65">
                      Ref: {movement.reference}
                    </div>
                  )}
                  {movement.notes && (
                    <div className="mt-1 break-words text-xs text-white/40">
                      {movement.notes}
                    </div>
                  )}
                  {!movement.reference && !movement.notes && (
                    <span className="text-xs text-white/25">
                      No additional details
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {movementCount > movements.length && (
          <div className="border-t border-white/[0.06] px-5 py-3 text-xs text-white/35">
            Showing {movements.length} of {movementCount} movements. The
            movement endpoint is paginated.
          </div>
        )}
      </section>

      <div className="text-xs text-white/35">
        Last updated: {formatDate(item.updated_at)}
      </div>

      {activeOperation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOperation();
          }}
        >
          <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#101820] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#39D5F2]">
                  {OPERATIONS[activeOperation].icon}
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Inventory operation
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-white">
                  {OPERATIONS[activeOperation].title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  {OPERATIONS[activeOperation].description}
                </p>
              </div>
              <button
                type="button"
                onClick={closeOperation}
                disabled={submitting}
                aria-label="Close operation dialog"
                className="rounded-lg p-2 text-white/45 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
              >
                Ã—
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="text-sm font-medium text-white">
                {item.product_name}
              </div>
              <div className="mt-1 text-xs text-white/40">
                {item.sku} Â· {item.location_name}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-white/35">On hand</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatNumber(item.quantity)}
                  </div>
                </div>
                <div>
                  <div className="text-white/35">Reserved</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatNumber(item.reserved_quantity)}
                  </div>
                </div>
                <div>
                  <div className="text-white/35">Available</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatNumber(item.available_quantity)}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={submitOperation} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/75">
                  {OPERATIONS[activeOperation].quantityLabel}
                </label>
                <input
                  type="number"
                  min={activeOperation === "adjust" ? 0 : 1}
                  step="1"
                  required
                  autoFocus
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Enter a whole number"
                  className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#39D5F2]/50"
                />
                {activeOperation === "adjust" && (
                  <p className="mt-2 text-xs text-amber-300/80">
                    Enter the final physical quantity, not the difference.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/75">
                  Reference <span className="text-white/30">(optional)</span>
                </label>
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  maxLength={150}
                  placeholder="e.g. PO-2026-001 or stock count reference"
                  className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#39D5F2]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/75">
                  Notes <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Add an explanation for this operation..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#39D5F2]/50"
                />
              </div>

              {operationError && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 py-3 text-sm text-red-200">
                  {operationError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeOperation}
                  disabled={submitting}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/65 transition hover:bg-white/[0.05] disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || quantity === ""}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0786AD] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0799C4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    OPERATIONS[activeOperation].submitLabel
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  warning = false,
}: {
  label: string;
  value: number;
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
      <div className="mt-3 text-2xl font-bold tabular-nums text-white">
        {formatNumber(value)}
      </div>
      <p className="mt-1 text-xs text-white/35">{detail}</p>
    </div>
  );
}
