"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthContext } from "@/providers/auth-provider";
import { apiGet } from "@/lib/api/client";

import type {
  Order,
  OrderStatus,
} from "@/types/order";

function formatMoney(
  value: string,
  currency = "NGN"
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Awaiting payment";

    case "PAID":
      return "Paid";

    case "PROCESSING":
      return "Processing";

    case "SHIPPED":
      return "Shipped";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
      return "Cancelled";

    case "REFUNDED":
      return "Refunded";

    default:
      return status;
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return Clock3;

    case "PAID":
      return CheckCircle2;

    case "PROCESSING":
      return Package;

    case "SHIPPED":
      return Truck;

    case "DELIVERED":
      return CheckCircle2;

    case "CANCELLED":
      return XCircle;

    case "REFUNDED":
      return RefreshCw;

    default:
      return Package;
  }
}

function getStatusClasses(status: OrderStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";

    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";

    case "PROCESSING":
      return "border-[#0786AD]/20 bg-[#E3F8FC] text-[#05647F] dark:border-[#0786AD]/20 dark:bg-[#0786AD]/10 dark:text-[#39D5F2]";

    case "SHIPPED":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300";

    case "DELIVERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";

    case "REFUNDED":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";

    default:
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
  }
}

const STATUS_STEPS = [
  {
    status: "PENDING_PAYMENT" as OrderStatus,
    label: "Order placed",
    description: "Your order has been received.",
    icon: ShoppingBag,
  },
  {
    status: "PAID" as OrderStatus,
    label: "Payment confirmed",
    description: "Your payment has been confirmed.",
    icon: CreditCard,
  },
  {
    status: "PROCESSING" as OrderStatus,
    label: "Processing",
    description: "Your order is being prepared.",
    icon: Package,
  },
  {
    status: "SHIPPED" as OrderStatus,
    label: "Shipped",
    description: "Your order is on its way.",
    icon: Truck,
  },
  {
    status: "DELIVERED" as OrderStatus,
    label: "Delivered",
    description: "Your order has been delivered.",
    icon: CheckCircle2,
  },
];

function getStatusIndex(status: OrderStatus) {
  const index = STATUS_STEPS.findIndex(
    (step) => step.status === status
  );

  return index >= 0 ? index : 0;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isLoading: authLoading,
    isAuthenticated,
  } = useAuthContext();

  /*
   * We deliberately derive the order number from
   * the URL path instead of relying on useParams().
   *
   * Example:
   * /orders/GBT-20260922-C1FB47C1
   *
   * becomes:
   * GBT-20260922-C1FB47C1
   */
  const orderNumber = useMemo(() => {
    const segments = pathname
      .split("/")
      .filter(Boolean);

    if (segments.length < 2) {
      return "";
    }

    return decodeURIComponent(
      segments[segments.length - 1]
    );
  }, [pathname]);

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadOrder = useCallback(
    async () => {
      if (!orderNumber) {
        setError(
          "We couldn't determine which order to display."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
         * Use the dedicated backend endpoint:
         *
         * GET /api/v1/orders/<order_number>/
         *
         * This is better than loading every order
         * and searching through them on the frontend.
         */
        const data = await apiGet<Order>(
          `/orders/${encodeURIComponent(
            orderNumber
          )}/`,
          true
        );

        setOrder(data);
      } catch (err) {
        console.error(
          "Failed to load order:",
          err
        );

        setOrder(null);

        setError(
          "We couldn't load this order. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [orderNumber]
  );

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      router.replace(
        `/login?next=${encodeURIComponent(
          `/orders/${orderNumber}`
        )}`
      );
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
    orderNumber,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadOrder();
  }, [
    isAuthenticated,
    loadOrder,
  ]);

  if (
    authLoading ||
    (!isAuthenticated && loading)
  ) {
    return <OrderDetailSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <OrderNotFound
        message={
          error ||
          "This order could not be found."
        }
        onRetry={loadOrder}
      />
    );
  }

  return (
    <OrderDetailContent
      order={order}
      onRefresh={loadOrder}
      refreshing={loading}
    />
  );
}

function OrderDetailContent({
  order,
  onRefresh,
  refreshing,
}: {
  order: Order;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const statusIndex = getStatusIndex(
    order.status
  );

  const itemCount = useMemo(
    () =>
      order.items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [order.items]
  );

  const isTerminal =
    order.status === "CANCELLED" ||
    order.status === "REFUNDED";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] text-slate-900 dark:bg-[#05090e] dark:text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#39D5F2]/10 blur-3xl" />

        <div className="absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-[#0786AD]/10 blur-3xl" />

        <div className="absolute left-1/2 top-[55%] h-80 w-80 -translate-x-1/2 rounded-full bg-[#39D5F2]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {/* Navigation */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/orders"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#0786AD] dark:text-slate-400 dark:hover:text-[#39D5F2]"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back to orders
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#0786AD]/30 hover:text-[#0786AD] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:text-[#39D5F2]"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_25px_100px_rgba(15,23,42,0.06)] backdrop-blur-2xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-white/[0.045]">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#39D5F2]/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0786AD]/15 bg-[#E3F8FC]/70 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#05647F] backdrop-blur-xl dark:border-white/10 dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
                <Package size={14} />
                Order details
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Order number
              </p>

              <h1 className="mt-2 break-all text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                {order.order_number}
              </h1>

              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Placed {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${getStatusClasses(
                  order.status
                )}`}
              >
                {(() => {
                  const Icon =
                    getStatusIcon(
                      order.status
                    );

                  return <Icon size={15} />;
                })()}

                {getStatusLabel(order.status)}
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${
                  order.payment_status ===
                  "PAID"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                }`}
              >
                <CreditCard size={15} />

                {order.payment_status ===
                "PAID"
                  ? "Payment confirmed"
                  : "Payment pending"}
              </span>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-6 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:p-8 dark:border-white/10 dark:bg-white/[0.045]">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0786AD] dark:text-[#39D5F2]">
              Order progress
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight">
              Track your order
            </h2>
          </div>

          {isTerminal ? (
            <TerminalStatus
              status={order.status}
            />
          ) : (
            <div className="relative">
              <div className="hidden h-1 rounded-full bg-slate-100 sm:block dark:bg-white/10" />

              <div
                className="absolute left-0 top-0 hidden h-1 rounded-full bg-[#0786AD] transition-all sm:block dark:bg-[#39D5F2]"
                style={{
                  width:
                    statusIndex <= 0
                      ? "0%"
                      : `${Math.min(
                          (statusIndex /
                            (STATUS_STEPS.length -
                              1)) *
                            100,
                          100
                        )}%`,
                }}
              />

              <div className="grid gap-6 sm:grid-cols-5">
                {STATUS_STEPS.map(
                  (
                    step,
                    index
                  ) => {
                    const StepIcon =
                      step.icon;

                    const completed =
                      index <=
                      statusIndex;

                    const current =
                      index ===
                      statusIndex;

                    return (
                      <div
                        key={step.status}
                        className="relative flex items-start gap-3 sm:block sm:text-center"
                      >
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-[#f7fafc] transition dark:border-[#05090e] ${
                            completed
                              ? "bg-[#0786AD] text-white dark:bg-[#39D5F2] dark:text-[#03465B]"
                              : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
                          } ${
                            current
                              ? "shadow-[0_0_0_6px_rgba(57,213,242,0.10)]"
                              : ""
                          } sm:mx-auto`}
                        >
                          <StepIcon
                            size={16}
                          />
                        </div>

                        <div className="sm:pt-3">
                          <p
                            className={`text-sm font-bold ${
                              completed
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </section>

        {/* Items + Summary */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:p-8 dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Purchase
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Order items
                </h2>
              </div>

              <span className="rounded-full bg-[#E3F8FC] px-3 py-1.5 text-xs font-bold text-[#05647F] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
                {itemCount} item
                {itemCount === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <div className="mt-6 divide-y divide-slate-200/80 dark:divide-white/10">
              {order.items.map(
                (item, index) => (
                  <div
                    key={`${item.sku}-${index}`}
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
                      <ShoppingBag
                        size={23}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <div>
                          <h3 className="font-bold">
                            {item.product_name}
                          </h3>

                          {item.variant_name && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.variant_name}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-slate-400">
                            SKU: {item.sku}
                          </p>
                        </div>

                        <p className="font-black text-[#05647F] dark:text-[#39D5F2]">
                          {formatMoney(
                            item.line_total,
                            order.currency
                          )}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Qty:{" "}
                          <strong className="text-slate-700 dark:text-slate-200">
                            {item.quantity}
                          </strong>
                        </span>

                        <span>
                          Unit price:{" "}
                          <strong className="text-slate-700 dark:text-slate-200">
                            {formatMoney(
                              item.unit_price,
                              order.currency
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="h-fit rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-white/[0.045]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                Payment summary
              </p>

              <h2 className="mt-1 text-xl font-black">
                Order total
              </h2>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <SummaryRow
                label="Subtotal"
                value={formatMoney(
                  order.subtotal,
                  order.currency
                )}
              />

              <SummaryRow
                label="Shipping"
                value={formatMoney(
                  order.shipping_fee,
                  order.currency
                )}
              />

              <SummaryRow
                label="Tax"
                value={formatMoney(
                  order.tax_amount,
                  order.currency
                )}
              />

              <SummaryRow
                label="Discount"
                value={`-${formatMoney(
                  order.discount_amount,
                  order.currency
                )}`}
              />
            </div>

            <div className="my-5 h-px bg-slate-200 dark:bg-white/10" />

            <div className="rounded-2xl bg-[#E3F8FC]/60 p-4 dark:bg-[#0786AD]/5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Total
                </span>

                <span className="text-2xl font-black text-[#05647F] dark:text-[#39D5F2]">
                  {formatMoney(
                    order.total_amount,
                    order.currency
                  )}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3.5 dark:border-emerald-500/15 dark:bg-emerald-500/5">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              />

              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Payment status
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-600/80 dark:text-emerald-400/80">
                  {order.payment_status ===
                  "PAID"
                    ? "Your payment has been successfully confirmed."
                    : "Your payment is still awaiting confirmation."}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Shipping + Payment */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ShippingCard order={order} />

          <PaymentCard order={order} />
        </div>

        {/* Customer note */}
        {order.customer_note && (
          <section className="mt-6 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-white/[0.045]">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
              Order note
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {order.customer_note}
            </p>
          </section>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#0786AD]/30 hover:text-[#0786AD] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:text-[#39D5F2]"
          >
            <ArrowLeft size={16} />
            All orders
          </Link>

          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0786AD] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0786AD]/15 transition hover:bg-[#05647F]"
          >
            Continue shopping
            <ChevronRight size={17} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}

function ShippingCard({
  order,
}: {
  order: Order;
}) {
  const fullName = [
    order.shipping_first_name,
    order.shipping_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const cityState = [
    order.shipping_city,
    order.shipping_state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-white/[0.045]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
          <MapPin size={18} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Delivery
          </p>

          <h2 className="text-lg font-black">
            Shipping address
          </h2>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50/80 p-5 dark:bg-white/[0.035]">
        {fullName && (
          <p className="font-bold">
            {fullName}
          </p>
        )}

        {order.shipping_phone && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {order.shipping_phone}
          </p>
        )}

        {order.shipping_address_line_1 && (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {order.shipping_address_line_1}
          </p>
        )}

        {order.shipping_address_line_2 && (
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {order.shipping_address_line_2}
          </p>
        )}

        {cityState && (
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {cityState}
          </p>
        )}

        {order.shipping_postal_code && (
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {order.shipping_postal_code}
          </p>
        )}

        {order.shipping_country && (
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {order.shipping_country}
          </p>
        )}
      </div>
    </section>
  );
}

function PaymentCard({
  order,
}: {
  order: Order;
}) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-white/[0.045]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
          <CreditCard size={18} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Transaction
          </p>

          <h2 className="text-lg font-black">
            Payment details
          </h2>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <InfoRow
          label="Provider"
          value="Paystack"
        />

        <InfoRow
          label="Currency"
          value={order.currency}
        />

        <InfoRow
          label="Status"
          value={
            order.payment_status ===
            "PAID"
              ? "Paid"
              : "Pending"
          }
        />

        <InfoRow
          label="Order date"
          value={formatDate(
            order.created_at
          )}
        />

        {order.paid_at && (
          <InfoRow
            label="Paid at"
            value={formatDate(
              order.paid_at
            )}
          />
        )}
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 pb-3 last:border-0 last:pb-0 dark:border-white/10">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <span className="text-right text-sm font-bold">
        {value}
      </span>
    </div>
  );
}

function TerminalStatus({
  status,
}: {
  status: OrderStatus;
}) {
  const cancelled =
    status === "CANCELLED";

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border p-5 ${
        cancelled
          ? "border-red-200 bg-red-50/70 dark:border-red-500/15 dark:bg-red-500/5"
          : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.035]"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          cancelled
            ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300"
            : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
        }`}
      >
        {cancelled ? (
          <XCircle size={21} />
        ) : (
          <RefreshCw size={21} />
        )}
      </div>

      <div>
        <h3 className="font-bold">
          {getStatusLabel(status)}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {cancelled
            ? "This order has been cancelled and is no longer progressing through fulfillment."
            : "This order has reached a final state."}
        </p>
      </div>
    </div>
  );
}

function OrderNotFound({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fafc] px-5 py-16 dark:bg-[#05090e]">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39D5F2]/10 blur-3xl"
      />

      <section className="relative w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/80 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-10 dark:border-white/10 dark:bg-white/[0.045]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300">
          <Package size={27} />
        </div>

        <h1 className="mt-6 text-2xl font-black">
          Order unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0786AD] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#05647F]"
          >
            <RefreshCw size={16} />
            Try again
          </button>

          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#0786AD]/30 hover:text-[#0786AD] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:text-[#39D5F2]"
          >
            View all orders
          </Link>
        </div>
      </section>
    </main>
  );
}

function OrderDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#f7fafc] px-5 py-10 dark:bg-[#05090e]">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-white/10" />

        <div className="mt-7 rounded-[2rem] bg-white p-8 dark:bg-white/5">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />

          <div className="mt-4 h-10 w-72 rounded-xl bg-slate-200 dark:bg-white/10" />

          <div className="mt-3 h-4 w-48 rounded bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-8 dark:bg-white/5">
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-white/10" />

          <div className="mt-8 h-16 rounded-xl bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-96 rounded-[2rem] bg-white dark:bg-white/5" />

          <div className="h-80 rounded-[2rem] bg-white dark:bg-white/5" />
        </div>
      </div>
    </main>
  );
}