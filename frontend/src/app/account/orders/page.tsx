"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";

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
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";

    case "PAID":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";

    case "PROCESSING":
      return "bg-[#E3F8FC] text-[#05647F] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]";

    case "SHIPPED":
      return "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300";

    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";

    case "CANCELLED":
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";

    case "REFUNDED":
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300";

    default:
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300";
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

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      router.replace(
        "/login?next=/orders"
      );
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadOrders();
  }, [isAuthenticated]);

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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#39D5F2]/10 blur-3xl" />

        <div className="absolute -right-32 top-60 h-96 w-96 rounded-full bg-[#0786AD]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0786AD] dark:text-slate-400 dark:hover:text-[#39D5F2]"
        >
          <ArrowLeft size={16} />
          Back to account
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0786AD]/15 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#05647F] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-[#39D5F2]">
              <ClipboardList size={14} />
              Order history
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Your orders
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Track your purchases, payments,
              and delivery progress.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#0786AD]/30 hover:text-[#0786AD] disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:text-[#39D5F2]"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadOrders}
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

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
      </div>
    </main>
  );
}

function OrderCard({
  order,
}: {
  order: Order;
}) {
  return (
    <Link
      href={`/orders/${encodeURIComponent(
        order.order_number
      )}`}
      className="group relative block overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:shadow-[0_25px_80px_rgba(7,134,173,0.10)] dark:border-white/10 dark:bg-white/[0.045]"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#39D5F2]/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
              <Package size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Order
              </p>

              <h2 className="mt-1 font-black tracking-tight">
                {order.order_number}
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClasses(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-200/80 pt-5 sm:grid-cols-3 dark:border-white/10">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Items
            </p>

            <p className="mt-1 text-sm font-bold">
              {order.items.reduce(
                (total, item) =>
                  total + item.quantity,
                0
              )}{" "}
              item
              {order.items.reduce(
                (total, item) =>
                  total + item.quantity,
                0
              ) === 1
                ? ""
                : "s"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400">
              Payment
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
              <CreditCard size={14} />
              {order.payment_status ===
              "PAID"
                ? "Paid"
                : "Pending"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400">
              Total
            </p>

            <p className="mt-1 text-sm font-black text-[#05647F] dark:text-[#39D5F2]">
              {formatMoney(
                order.total_amount,
                order.currency
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShoppingBag size={14} />

            {order.items.length} product
            {order.items.length === 1
              ? ""
              : "s"}
          </div>

          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#0786AD] transition group-hover:gap-2 dark:text-[#39D5F2]">
            View order
            <ChevronRight size={17} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-16 text-center shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
        <ShoppingBag size={28} />
      </div>

      <h2 className="mt-5 text-xl font-black">
        No orders yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        Once you complete a purchase,
        your orders will appear here.
      </p>

      <Link
        href="/products"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0786AD] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0786AD]/20 transition hover:bg-[#05647F]"
      >
        Browse products
        <ChevronRight size={17} />
      </Link>
    </div>
  );
}

function OrdersSkeletonCards() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-56 animate-pulse rounded-[2rem] border border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <main className="min-h-screen bg-[#f7fafc] px-5 py-10 dark:bg-[#05090e]">
      <div className="mx-auto max-w-6xl">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />

        <div className="mt-8 h-12 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />

        <div className="mt-8 space-y-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-[2rem] bg-white dark:bg-white/5"
            />
          ))}
        </div>
      </div>
    </main>
  );
}