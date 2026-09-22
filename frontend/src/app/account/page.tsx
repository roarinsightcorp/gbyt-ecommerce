
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  LogOut,
  MapPin,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  UserRound,
  WalletCards,
} from "lucide-react";

import { useAuthContext } from "@/providers/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { getCart } from "@/lib/api/cart";

import type { Cart } from "@/types/cart";

export default function AccountPage() {
  const router = useRouter();

  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
  } = useAuthContext();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/account");
    }
  }, [
    isLoading,
    isAuthenticated,
    router,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartLoading(false);
      return;
    }

    async function loadCart() {
      try {
        setCartLoading(true);

        const data = await getCart();

        setCart(data);
      } catch (error) {
        console.error(
          "Failed to load account cart:",
          error
        );
      } finally {
        setCartLoading(false);
      }
    }

    loadCart();
  }, [isAuthenticated]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logout();

      router.replace("/");
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return <AccountLoading />;
  }

  const firstName =
    user?.first_name?.trim() ||
    "Customer";

  const fullName =
    `${user?.first_name || ""} ${
      user?.last_name || ""
    }`.trim() || "Customer";

  const initials =
    `${user?.first_name?.charAt(0) || ""}${
      user?.last_name?.charAt(0) || ""
    }`.toUpperCase() || "C";

  const itemCount =
    cart?.item_count ??
    cart?.items?.length ??
    0;

  const cartTotal =
    Number(cart?.subtotal ?? 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">

      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[560px] w-[560px] rounded-full bg-[var(--brand-glow)]/10 blur-[140px]" />

        <div className="absolute -right-48 top-[12%] h-[560px] w-[560px] rounded-full bg-[var(--brand)]/10 blur-[140px]" />

        <div className="absolute bottom-[-260px] left-[25%] h-[560px] w-[560px] rounded-full bg-[#7C3AED]/5 blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">

        {/* =========================================================
            TOP NAV
        ========================================================= */}

        <header className="mb-7 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-dark)] via-[var(--brand-deep)] to-[var(--brand-glow)] text-white shadow-lg shadow-[var(--brand)]/20 transition duration-300 group-hover:scale-105">
              <ShoppingBag className="h-5 w-5" />

              <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
            </div>

            <div>
              <p className="text-base font-black tracking-tight">
                G by T
              </p>

              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                Customer Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-strong)] shadow-sm backdrop-blur-xl transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link
              href="/products"
              className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--brand)]/30 hover:text-[var(--brand)] sm:flex"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </header>

        {/* =========================================================
            HERO / CUSTOMER IDENTITY
        ========================================================= */}

        <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_25px_90px_rgba(7,134,173,0.08)] backdrop-blur-2xl">

          <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-[420px] w-[420px] rounded-full bg-[var(--brand-glow)]/10 blur-[100px]" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">

            <div className="flex flex-col justify-center">

              {/* Eyebrow */}

              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-glow)] opacity-70" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-deep)] dark:text-[var(--brand-glow)]">
                  My Account
                </span>
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-[var(--brand-deep)] via-[var(--brand)] to-[var(--brand-glow)] bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-[var(--muted)] sm:text-base">
                Everything you need to manage your
                G-BYT experience — orders, shopping,
                delivery information and your profile.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand)] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[var(--brand)]/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Browse Products

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
              </div>
            </div>

            {/* Customer identity card */}

            <div className="relative flex min-w-0 items-center gap-4 overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5 lg:min-w-[330px]">
              <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-[var(--brand-glow)]/10 blur-3xl" />

              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-glow)] text-lg font-black text-white shadow-xl shadow-[var(--brand)]/20">
                {initials}

                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--surface-muted)] bg-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div className="relative min-w-0">
                <p className="truncate text-base font-black">
                  {fullName}
                </p>

                <p className="mt-1 truncate text-xs font-medium text-[var(--muted)]">
                  {user?.email}
                </p>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--brand-deep)] dark:text-[var(--brand-glow)]">
                  <ShieldCheck className="h-3 w-3" />
                  {user?.role || "Customer"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            QUICK STATS
        ========================================================= */}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Cart Items"
            value={
              cartLoading
                ? "—"
                : String(itemCount)
            }
          />

          <StatCard
            icon={<WalletCards className="h-4 w-4" />}
            label="Cart Value"
            value={
              cartLoading
                ? "—"
                : `₦${cartTotal.toLocaleString()}`
            }
          />

          <StatCard
            icon={<Package className="h-4 w-4" />}
            label="Orders"
            value="—"
          />

          <StatCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Account"
            value="Secure"
            accent
          />
        </section>

        {/* =========================================================
            MAIN DASHBOARD
        ========================================================= */}

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          {/* CART */}

          <DashboardCard
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Shopping Cart"
            description="Review your selected products and continue your purchase."
            badge={
              cartLoading
                ? "Loading"
                : `${itemCount} ${
                    itemCount === 1
                      ? "item"
                      : "items"
                  }`
            }
            featured
          >
            <div className="mt-7">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Current total
              </p>

              <p className="mt-1 text-3xl font-black tracking-tight text-[var(--brand-deep)] dark:text-[var(--brand-glow)]">
                ₦{cartTotal.toLocaleString()}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-2.5 text-sm font-black transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
              >
                View Cart
                <ChevronRight className="h-4 w-4" />
              </Link>

              {itemCount > 0 && (
                <Link
                  href="/checkout"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-deep)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--brand)]"
                >
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </DashboardCard>

          {/* ORDERS */}

          <DashboardCard
            icon={<Package className="h-5 w-5" />}
            title="Orders"
            description="View previous purchases and keep track of your deliveries."
          >
            <DashboardLink href="/account/orders">
              View Orders
            </DashboardLink>
          </DashboardCard>

          {/* PROFILE */}

          <DashboardCard
            icon={<UserRound className="h-5 w-5" />}
            title="Profile"
            description="Keep your personal information and account details up to date."
          >
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <InfoRow
                label="Name"
                value={fullName}
              />

              <div className="my-3 h-px bg-[var(--border)]" />

              <InfoRow
                label="Email"
                value={user?.email || "—"}
              />
            </div>

            <DashboardLink href="/account/profile">
              Manage Profile
            </DashboardLink>
          </DashboardCard>

          {/* ADDRESSES */}

          <DashboardCard
            icon={<MapPin className="h-5 w-5" />}
            title="Addresses"
            description="Manage the shipping and delivery addresses connected to your account."
          >
            <DashboardLink href="/account/addresses">
              Manage Addresses
            </DashboardLink>
          </DashboardCard>

          {/* SETTINGS */}

          <DashboardCard
            icon={<Settings className="h-5 w-5" />}
            title="Settings"
            description="Control your appearance and personalize your G-BYT experience."
          >
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-black">
                    Appearance
                  </p>

                  <p className="mt-0.5 text-[11px] capitalize text-[var(--muted)]">
                    {theme} mode
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 text-xs font-black transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
              >
                Switch
              </button>
            </div>

            <DashboardLink href="/account/settings">
              Manage Settings
            </DashboardLink>
          </DashboardCard>

          {/* CONTINUE SHOPPING */}

          <div className="group relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[var(--brand-dark)] via-[var(--brand-deep)] to-[var(--brand)] p-6 text-white shadow-[0_20px_60px_rgba(5,98,127,0.20)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(5,98,127,0.30)]">

            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--brand-glow)]/20 blur-3xl transition-transform duration-700 group-hover:scale-125" />

            <div className="pointer-events-none absolute bottom-[-70px] left-[-40px] h-40 w-40 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md">
                <Sparkles className="h-5 w-5" />
              </div>

              <h2 className="mt-6 text-xl font-black">
                Continue Shopping
              </h2>

              <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-cyan-50/90">
                Discover products, explore new arrivals
                and find something worth taking home.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-[var(--brand-deep)] shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                Explore Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* SECURITY */}

          <DashboardCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Account Security"
            description="Your session is protected. Sign out securely when you're finished."
          >
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <CircleCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-black">
                  Account protected
                </p>

                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  Secure authenticated session
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-black text-red-600 transition hover:border-red-500/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
            >
              <LogOut className="h-4 w-4" />

              {loggingOut
                ? "Signing Out..."
                : "Sign Out"}
            </button>
          </DashboardCard>
        </section>

        {/* =========================================================
            FOOTER
        ========================================================= */}

        <footer className="mt-8 flex flex-col items-center justify-center gap-2 pb-4 text-center text-xs font-bold text-[var(--muted)] sm:flex-row">
          <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />

          <span>
            Your account is securely connected
          </span>

          <span className="hidden text-[var(--border)] sm:inline">
            •
          </span>

          <span>
            G-BYT — Your global trading partner
          </span>
        </footer>
      </div>
    </main>
  );
}

/* ===============================================================
   LOADING STATE
================================================================ */

function AccountLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-[var(--brand)]/10 border-t-[var(--brand)]" />

          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-[var(--brand)]" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-black">
            Preparing your account...
          </p>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Securing your customer portal
          </p>
        </div>
      </div>
    </main>
  );
}

/* ===============================================================
   STAT CARD
================================================================ */

function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 ${
        accent
          ? "border-emerald-500/15 bg-emerald-500/[0.035]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          accent
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-[var(--brand-soft)] text-[var(--brand-deep)] dark:text-[var(--brand-glow)]"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-black">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ===============================================================
   DASHBOARD CARD
================================================================ */

function DashboardCard({
  icon,
  title,
  description,
  badge,
  featured = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  featured?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.75rem] border p-6 transition-all duration-300 hover:-translate-y-1 ${
        featured
          ? "border-[var(--brand)]/20 bg-[var(--surface)] shadow-[0_18px_55px_rgba(8,126,164,0.08)] hover:border-[var(--brand)]/35 hover:shadow-[0_25px_65px_rgba(8,126,164,0.13)]"
          : "border-[var(--border)] bg-[var(--surface)] shadow-[0_15px_45px_rgba(5,98,127,0.05)] hover:border-[var(--brand)]/25 hover:shadow-xl"
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[var(--brand-glow)]/5 blur-3xl transition-transform duration-500 group-hover:scale-150" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-deep)] dark:text-[var(--brand-glow)]">
            {icon}
          </div>

          {badge && (
            <span className="rounded-full border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-1.5 text-[10px] font-black text-[var(--brand-deep)] dark:text-[var(--brand-glow)]">
              {badge}
            </span>
          )}
        </div>

        <h2 className="mt-6 text-xl font-black tracking-tight">
          {title}
        </h2>

        <p className="mt-2 text-sm font-medium leading-6 text-[var(--muted)]">
          {description}
        </p>

        {children}
      </div>
    </div>
  );
}

/* ===============================================================
   DASHBOARD LINK
================================================================ */

function DashboardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group/link mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-2.5 text-sm font-black transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
    >
      {children}

      <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
    </Link>
  );
}

/* ===============================================================
   INFO ROW
================================================================ */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="shrink-0 font-semibold text-[var(--muted)]">
        {label}
      </span>

      <span className="max-w-[65%] truncate text-right font-black">
        {value}
      </span>
    </div>
  );
}
