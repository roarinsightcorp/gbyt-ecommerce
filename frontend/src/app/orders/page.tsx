"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthContext } from "@/providers/auth-provider";
import { getOrders } from "@/lib/api/orders";

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

function getPaymentLabel(paymentStatus: string) {
  switch (paymentStatus) {
    case "PAID":
      return "Payment confirmed";

    case "FAILED":
      return "Payment failed";

    case "REFUNDED":
      return "Payment refunded";

    default:
      return "Payment pending";
  }
}

export default function OrdersPage() {
  const router = useRouter();

  const {
    isLoading: authLoading,
    isAuthenticated,
  } = useAuthContext();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders();

      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);

      setError(
        "We couldn't load your orders right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?next=/orders");
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadOrders();
  }, [
    isAuthenticated,
    loadOrders,
  ]);

  const statistics = useMemo(() => {
    const total = orders.length;

    const paid = orders.filter(
      (order) =>
        order.payment_status === "PAID"
    ).length;

    const processing = orders.filter(
      (order) =>
        order.status === "PROCESSING" ||
        order.status === "SHIPPED"
    ).length;

    const delivered = orders.filter(
      (order) =>
        order.status === "DELIVERED"
    ).length;

    return {
      total,
      paid,
      processing,
      delivered,
    };
  }, [orders]);

  if (
    authLoading ||
    (!isAuthenticated && loading)
  ) {
    return <OrdersSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] text-slate-900 dark:bg-[#05090e] dark:text-white">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#39D5F2]/10 blur-3xl" />

        <div className="absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-[#0786AD]/10 blur-3xl" />

        <div className="absolute left-1/2 top-[45%] h-80 w-80 -translate-x-1/2 rounded-full bg-[#39D5F2]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {/* Breadcrumb */}
        <Link
          href="/account"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#0786AD] dark:text-slate-400 dark:hover:text-[#39D5F2]"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Back to account
        </Link>

        {/* Header */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_25px_100px_rgba(15,23,42,0.06)] backdrop-blur-2xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-white/[0.045]">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#39D5F2]/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-[-100px] left-1/3 h-60 w-60 rounded-full bg-[#0786AD]/5 blur-3xl"
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0786AD]/15 bg-[#E3F8FC]/70 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#05647F] backdrop-blur-xl dark:border-white/10 dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
                <ClipboardList size={14} />
                Order history
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Your orders
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base dark:text-slate-400">
                Everything you've purchased from G-BYT,
                all in one place. Track payments, order
                progress, and delivery status.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#0786AD]/30 hover:text-[#0786AD] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-[#39D5F2]/30 dark:hover:text-[#39D5F2]"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh orders
            </button>
          </div>
        </section>

        {/* Statistics */}
        {!loading && orders.length > 0 && (
          <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Total orders"
              value={statistics.total}
            />

            <StatCard
              icon={CreditCard}
              label="Paid orders"
              value={statistics.paid}
            />

            <StatCard
              icon={Truck}
              label="In progress"
              value={statistics.processing}
            />

            <StatCard
              icon={CheckCircle2}
              label="Delivered"
              value={statistics.delivered}
            />
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-5 py-4 text-sm text-red-700 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <div className="flex items-center gap-3">
              <XCircle
                size={18}
                className="shrink-0"
              />

              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              className="font-bold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* Orders */}
        <section className="mt-8">
          {loading ? (
            <OrdersSkeletonCards />
          ) : orders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_15px_50px_rgba(15,23,42,0.045)] backdrop-blur-xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.045]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#39D5F2]/5 blur-2xl transition group-hover:bg-[#39D5F2]/10" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
            <Icon size={18} />
          </div>

          <span className="text-2xl font-black tracking-tight">
            {value}
          </span>
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}

function OrderCard({
  order,
}: {
  order: Order;
}) {
  const StatusIcon = getStatusIcon(
    order.status
  );

  const itemCount = order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const visibleItems = order.items.slice(
    0,
    3
  );

  const remainingItems =
    order.items.length - visibleItems.length;

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.055)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(7,134,173,0.10)] sm:p-6 lg:p-7 dark:border-white/10 dark:bg-white/[0.045]">
      {/* Card glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#39D5F2]/8 blur-3xl transition duration-500 group-hover:bg-[#39D5F2]/12"
      />

      <div className="relative">
        {/* Top row */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E3F8FC] text-[#0786AD] shadow-sm dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
              <Package size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Order number
              </p>

              <h2 className="mt-1 truncate text-base font-black tracking-tight sm:text-lg">
                {order.order_number}
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Placed {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                order.status
              )}`}
            >
              <StatusIcon size={13} />
              {getStatusLabel(order.status)}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                order.payment_status === "PAID"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
              }`}
            >
              <CreditCard size={13} />
              {order.payment_status ===
              "PAID"
                ? "Paid"
                : "Payment pending"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-slate-200/80 dark:bg-white/10" />

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Items
            </p>

            <div className="space-y-2.5">
              {visibleItems.map(
                (item, index) => (
                  <div
                    key={`${order.id}-${item.sku}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-slate-50/80 px-3.5 py-3 dark:bg-white/[0.035]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-[#0786AD] shadow-sm dark:bg-white/10 dark:text-[#39D5F2]">
                        {item.quantity}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {item.product_name}
                        </p>

                        {item.variant_name && (
                          <p className="truncate text-xs text-slate-400">
                            {item.variant_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
                      {formatMoney(
                        item.line_total,
                        order.currency
                      )}
                    </p>
                  </div>
                )
              )}
            </div>

            {remainingItems > 0 && (
              <p className="mt-3 text-xs font-semibold text-[#0786AD] dark:text-[#39D5F2]">
                + {remainingItems} more product
                {remainingItems === 1
                  ? ""
                  : "s"}
              </p>
            )}
          </div>

          {/* Total */}
          <div className="flex min-w-[190px] flex-col justify-between rounded-2xl border border-[#0786AD]/10 bg-[#E3F8FC]/45 p-5 dark:border-[#0786AD]/15 dark:bg-[#0786AD]/5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Order total
              </p>

              <p className="mt-2 text-2xl font-black tracking-tight text-[#05647F] dark:text-[#39D5F2]">
                {formatMoney(
                  order.total_amount,
                  order.currency
                )}
              </p>
            </div>

            <div className="mt-5 border-t border-[#0786AD]/10 pt-4 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {itemCount} item
                {itemCount === 1
                  ? ""
                  : "s"}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {getPaymentLabel(
                  order.payment_status
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200/80 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShoppingBag size={14} />

            <span>
              {itemCount} item
              {itemCount === 1
                ? ""
                : "s"} in this order
            </span>
          </div>

          <Link
            href={`/orders/${encodeURIComponent(
              order.order_number
            )}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0786AD] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0786AD]/15 transition hover:bg-[#05647F] hover:shadow-[#0786AD]/25 dark:hover:bg-[#39D5F2] dark:hover:text-[#03465B]"
          >
            View order
            <ChevronRight
              size={17}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyOrders() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-6 py-20 text-center shadow-[0_20px_70px_rgba(15,23,42,0.055)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39D5F2]/5 blur-3xl"
      />

      <div className="relative">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#E3F8FC] text-[#0786AD] shadow-sm dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
          <ShoppingBag size={34} />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#0786AD] dark:text-[#39D5F2]">
          Your shopping journey
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          No orders yet
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
          Once you complete your first purchase,
          your order history and payment details
          will appear here.
        </p>

        <Link
          href="/products"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0786AD] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0786AD]/20 transition hover:bg-[#05647F]"
        >
          Browse products
          <ChevronRight size={17} />
        </Link>
      </div>
    </div>
  );
}

function OrdersSkeletonCards() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="animate-pulse">
            <div className="flex items-start justify-between gap-5">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-white/10" />

                <div>
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/10" />

                  <div className="mt-2 h-5 w-36 rounded bg-slate-200 dark:bg-white/10" />

                  <div className="mt-2 h-3 w-28 rounded bg-slate-200 dark:bg-white/10" />
                </div>
              </div>

              <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>

            <div className="my-6 h-px bg-slate-200 dark:bg-white/10" />

            <div className="space-y-3">
              <div className="h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <main className="min-h-screen bg-[#f7fafc] px-5 py-10 dark:bg-[#05090e]">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-white/10" />

        <div className="mt-8 rounded-[2rem] bg-white p-8 dark:bg-white/5">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />

          <div className="mt-4 h-12 w-64 rounded-xl bg-slate-200 dark:bg-white/10" />

          <div className="mt-4 h-5 w-full max-w-xl rounded bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-white dark:bg-white/5"
              />
            )
          )}
        </div>

        <div className="mt-8">
          <OrdersSkeletonCards />
        </div>
      </div>
    </main>
  );
}