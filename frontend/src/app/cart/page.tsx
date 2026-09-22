
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Package,
  Sparkles,
  Truck,
  CreditCard,
  X,
} from "lucide-react";

import { useCart } from "@/providers/cart-provider";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    isLoading,
    updateItem,
    removeItem,
    clearCart,
  } = useCart();

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(value);

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7fafc] text-slate-900 dark:bg-[#05090e] dark:text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          <div className="mb-10 h-5 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />

          <div className="mb-10">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-12 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-[1.5rem] bg-slate-200/70 dark:bg-white/[0.06]"
                />
              ))}
            </div>

            <div className="h-80 animate-pulse rounded-[1.5rem] bg-slate-200/70 dark:bg-white/[0.06]" />

          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     EMPTY CART
  ========================================================= */

  if (items.length === 0) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] text-slate-900 dark:bg-[#05090e] dark:text-white">

        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-400/10 blur-[100px]" />
          <div className="absolute right-[-150px] top-1/3 h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[110px]" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-12 sm:px-6">

          <div className="w-full rounded-[2rem] border border-slate-200/80 bg-white/85 p-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1119]/90 sm:p-14">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-300">
              <ShoppingBag className="h-10 w-10" />
            </div>

            <div className="mx-auto mt-8 max-w-lg">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] !text-cyan-700 dark:!text-cyan-300">
                  Your cart
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight !text-slate-950 dark:!text-white sm:text-4xl">
                Your cart is empty
              </h1>

              <p className="mt-4 text-sm leading-7 !text-slate-600 dark:!text-slate-400 sm:text-base">
                You haven't added anything yet. Explore our products and
                discover something worth taking home.
              </p>

            </div>

            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#05627F] to-[#087EA4] px-6 py-3.5 text-sm font-bold !text-white shadow-lg shadow-cyan-900/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN CART
  ========================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] text-slate-900 dark:bg-[#05090e] dark:text-white">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-cyan-400/[0.08] blur-[130px]" />

        <div className="absolute right-[-220px] top-[20%] h-[550px] w-[550px] rounded-full bg-blue-500/[0.08] blur-[130px]" />

        <div className="absolute bottom-[-250px] left-[25%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(#0f172a 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">

        {/* =====================================================
            TOP NAV
        ===================================================== */}

        <div className="mb-8 flex items-center justify-between">

          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold !text-slate-600 transition hover:!text-cyan-700 dark:!text-slate-300 dark:hover:!text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Continue Shopping
          </Link>

          <div className="hidden items-center gap-2 text-xs font-semibold !text-slate-400 sm:flex dark:!text-slate-500">
            <ShieldCheck className="h-4 w-4 !text-emerald-500" />
            Secure shopping
          </div>

        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="mb-9">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">

            <ShoppingBag className="h-3.5 w-3.5 !text-cyan-700 dark:!text-cyan-300" />

            <span className="text-[10px] font-black uppercase tracking-[0.2em] !text-cyan-700 dark:!text-cyan-300">
              Shopping Cart
            </span>

          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>
              <h1 className="text-4xl font-black tracking-[-0.04em] !text-slate-950 dark:!text-white sm:text-5xl">
                Your Cart
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 !text-slate-500 dark:!text-slate-400">
                Review your selected products before moving on to checkout.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">

              <Package className="h-4 w-4 !text-cyan-600 dark:!text-cyan-400" />

              <span className="text-sm font-bold !text-slate-700 dark:!text-slate-200">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>

            </div>

          </div>

        </header>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_390px]">

          {/* ===================================================
              CART ITEMS
          =================================================== */}

          <section>

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-sm font-bold uppercase tracking-[0.15em] !text-slate-500 dark:!text-slate-400">
                Selected Products
              </h2>

              <button
                type="button"
                onClick={() => clearCart()}
                className="group inline-flex items-center gap-1.5 text-xs font-bold !text-slate-400 transition hover:!text-red-500 dark:!text-slate-500 dark:hover:!text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                Clear cart
              </button>

            </div>

            <div className="space-y-4">

              {items.map((item) => {

                const quantity = item.quantity;
                const unitPrice = Number(item.unit_price);
                const lineTotal = Number(item.line_total);

                return (
                  <article
                    key={item.id}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/60 hover:shadow-[0_18px_50px_rgba(8,126,164,0.10)] dark:border-white/[0.08] dark:bg-[#0b1119]/85 dark:shadow-black/20"
                  >

                    {/* Accent */}
                    <div className="absolute left-0 top-6 h-10 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="flex flex-col gap-5 sm:flex-row">

                      {/* Product image */}

                      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/[0.04] sm:h-32 sm:w-32">

                        {item.primary_image?.url ? (
                          <img
                            src={item.primary_image.url}
                            alt={
                              item.primary_image.alt_text ||
                              item.product_name
                            }
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-9 w-9 !text-slate-300 dark:!text-slate-600" />
                          </div>
                        )}

                        <div className="absolute inset-x-2 bottom-2 flex justify-center">
                          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider !text-white backdrop-blur-md">
                            In Cart
                          </span>
                        </div>

                      </div>

                      {/* Details */}

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-5">

                        <div>

                          <Link
                            href={`/products/${item.product_slug}`}
                            className="line-clamp-2 text-base font-black !text-slate-950 transition hover:!text-cyan-700 dark:!text-white dark:hover:!text-cyan-300 sm:text-lg"
                          >
                            {item.product_name}
                          </Link>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">

                            <p className="text-xs font-medium !text-slate-400 dark:!text-slate-500">
                              SKU: {item.sku}
                            </p>

                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />

                            <p className="text-xs font-semibold !text-slate-500 dark:!text-slate-400">
                              {formatPrice(unitPrice)} each
                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">

                          {/* Quantity */}

                          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">

                            <button
                              type="button"
                              disabled={quantity <= 1}
                              onClick={() =>
                                updateItem(item.id, quantity - 1)
                              }
                              aria-label={`Decrease quantity of ${item.product_name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg !text-slate-500 transition hover:bg-white hover:!text-cyan-600 disabled:cursor-not-allowed disabled:opacity-30 dark:!text-slate-300 dark:hover:bg-white/10 dark:hover:!text-cyan-300"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="flex h-8 min-w-9 items-center justify-center text-sm font-black !text-slate-950 dark:!text-white">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateItem(item.id, quantity + 1)
                              }
                              aria-label={`Increase quantity of ${item.product_name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg !text-slate-500 transition hover:bg-white hover:!text-cyan-600 dark:!text-slate-300 dark:hover:bg-white/10 dark:hover:!text-cyan-300"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>

                          </div>

                          {/* Remove */}

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold !text-slate-400 transition hover:!text-red-500 dark:!text-slate-500 dark:hover:!text-red-400"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>

                          {/* Price */}

                          <div className="ml-auto text-right">

                            <p className="text-[10px] font-bold uppercase tracking-wider !text-slate-400 dark:!text-slate-500">
                              Total
                            </p>

                            <p className="mt-0.5 text-lg font-black !text-slate-950 dark:!text-white">
                              {formatPrice(lineTotal)}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

            {/* Bottom reassurance */}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              <TrustItem
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Secure Checkout"
              />

              <TrustItem
                icon={<Truck className="h-4 w-4" />}
                title="Reliable Delivery"
              />

              <TrustItem
                icon={<CreditCard className="h-4 w-4" />}
                title="Safe Payments"
              />

            </div>

          </section>

          {/* ===================================================
              ORDER SUMMARY
          =================================================== */}

          <aside className="lg:sticky lg:top-6">

            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#0b1119]/90">

              {/* Glow */}

              <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-[70px]" />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-cyan-600 dark:!text-cyan-400">
                      Checkout
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight !text-slate-950 dark:!text-white">
                      Order Summary
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                    <ShoppingBag className="h-5 w-5 !text-cyan-600 dark:!text-cyan-400" />
                  </div>

                </div>

                {/* Summary rows */}

                <div className="mt-7 space-y-4">

                  <SummaryRow
                    label="Items"
                    value={`${itemCount} ${
                      itemCount === 1 ? "item" : "items"
                    }`}
                  />

                  <SummaryRow
                    label="Subtotal"
                    value={formatPrice(Number(subtotal))}
                  />

                  <SummaryRow
                    label="Shipping"
                    value="Calculated at checkout"
                    muted
                  />

                </div>

                {/* Total */}

                <div className="my-6 h-px bg-slate-200 dark:bg-white/10" />

                <div className="flex items-end justify-between gap-4">

                  <div>
                    <p className="text-xs font-semibold !text-slate-400 dark:!text-slate-500">
                      Total
                    </p>

                    <p className="mt-1 text-3xl font-black tracking-tight !text-slate-950 dark:!text-white">
                      {formatPrice(Number(subtotal))}
                    </p>
                  </div>

                  <span className="mb-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider !text-emerald-600 dark:!text-emerald-400">
                    Current
                  </span>

                </div>

                {/* Checkout */}

                <Link
                  href="/checkout"
                  className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#05627F] via-[#087EA4] to-[#0b8fb7] px-5 py-4 text-sm font-black !text-white shadow-lg shadow-cyan-900/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-900/25"
                >
                  Proceed to Checkout

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Security */}

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]">

                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 !text-emerald-500" />

                  <p className="text-[11px] leading-5 !text-slate-500 dark:!text-slate-400">
                    Your order information is protected. Shipping and final
                    charges will be confirmed during checkout.
                  </p>

                </div>

              </div>

            </div>

            {/* Continue shopping */}

            <Link
              href="/products"
              className="group mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-bold !text-slate-600 backdrop-blur-xl transition hover:border-cyan-300 hover:!text-cyan-700 dark:border-white/10 dark:bg-white/[0.03] dark:!text-slate-300 dark:hover:!text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Continue Shopping
            </Link>

          </aside>

        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="mt-10 flex items-center justify-center gap-2 pb-4 text-xs !text-slate-400 dark:!text-slate-600">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />

          <span>
            Secure G by T shopping experience
          </span>

        </footer>

      </div>
    </main>
  );
}

/* ===============================================================
   SUMMARY ROW
================================================================ */

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-sm !text-slate-500 dark:!text-slate-400">
        {label}
      </span>

      <span
        className={
          muted
            ? "text-right text-xs font-medium !text-slate-400 dark:!text-slate-500"
            : "text-sm font-bold !text-slate-800 dark:!text-slate-200"
        }
      >
        {value}
      </span>

    </div>
  );
}

/* ===============================================================
   TRUST ITEM
================================================================ */

function TrustItem({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-3 backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.025]">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400">
        {icon}
      </div>

      <span className="text-[11px] font-bold !text-slate-500 dark:!text-slate-400">
        {title}
      </span>

    </div>
  );
}
