"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthContext } from "@/providers/auth-provider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}

const mainNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: Boxes,
  },
];

const secondaryNavigation: NavigationItem[] = [
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

function isSafeInternalPath(path: string | null | undefined): boolean {
  if (!path) {
    return false;
  }

  return path.startsWith("/") && !path.startsWith("//");
}

function getLoginRedirect(pathname: string): string {
  const safePath = isSafeInternalPath(pathname)
    ? pathname
    : "/admin";

  return `/login?next=${encodeURIComponent(safePath)}`;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
  } = useAuthContext();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /*
   * --------------------------------------------------------------------------
   * ADMIN ACCESS GUARD
   * --------------------------------------------------------------------------
   *
   * Frontend routing improves the user experience, but the backend remains
   * the actual security boundary.
   *
   * Admin API endpoints are already protected by IsSuperAdmin.
   *
   * Application hierarchy:
   *
   * CUSTOMER
   *   role = CUSTOMER
   *   is_admin = false
   *
   * STAFF
   *   role = STAFF
   *   is_admin = false
   *
   * ADMIN
   *   role = STAFF
   *   is_admin = true
   *
   * We deliberately use is_admin here instead of is_superuser because that
   * is the application's administrator flag.
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace(getLoginRedirect(pathname));
      return;
    }

    /*
     * Only STAFF users with is_admin=true may enter /admin.
     */
    if (user.role !== "STAFF" || !user.is_admin) {
      /*
       * Regular staff members belong in /staff.
       */
      if (user.role === "STAFF") {
        router.replace("/staff");
        return;
      }

      /*
       * Customers belong in /account.
       */
      router.replace("/account");
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    pathname,
    router,
  ]);

  /*
   * Close the mobile sidebar after navigating.
   */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /*
   * --------------------------------------------------------------------------
   * LOGOUT
   * --------------------------------------------------------------------------
   */
  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      /*
       * AuthProvider handles the actual API logout and clears the
       * authenticated user state.
       */
      await logout();

      /*
       * Replace rather than push so the user cannot simply press Back
       * and return to the admin page.
       */
      router.replace("/login");
    } catch (error) {
      console.error("Admin logout failed:", error);

      /*
       * Even if the API logout request fails, the auth provider's logout
       * implementation clears local authentication state.
       *
       * We still send the user to login rather than leaving them inside
       * the admin interface.
       */
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  /*
   * --------------------------------------------------------------------------
   * ACTIVE NAVIGATION
   * --------------------------------------------------------------------------
   */
  function isNavigationActive(href: string): boolean {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  const allNavigation = useMemo(
    () => [...mainNavigation, ...secondaryNavigation],
    [],
  );

  /*
   * --------------------------------------------------------------------------
   * LOADING STATE
   * --------------------------------------------------------------------------
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05090e] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-white/10" />

              <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#0786AD]" />
            </div>

            <div className="text-sm text-white/50">
              Verifying administrator access...
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * UNAUTHORIZED FALLBACK
   * --------------------------------------------------------------------------
   *
   * Prevent rendering admin content while the redirect is happening.
   */
  if (
    !isAuthenticated ||
    !user ||
    user.role !== "STAFF" ||
    !user.is_admin
  ) {
    return (
      <div className="min-h-screen bg-[#05090e] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <ShieldCheck
                size={26}
                className="text-[#39D5F2]"
              />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-white">
                Checking access
              </h1>

              <p className="mt-1 text-sm text-white/45">
                Redirecting you to the appropriate area...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * ADMIN SHELL
   * --------------------------------------------------------------------------
   */
  return (
    <div className="min-h-screen bg-[#05090e] text-white">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR                                                            */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          border-r border-white/[0.07]
          bg-[#070c12]/95
          shadow-2xl shadow-black/30
          backdrop-blur-2xl
          transition-all duration-300
          ${collapsed ? "w-[84px]" : "w-[270px]"}
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Brand */}
        <div
          className={`
            flex h-[76px] shrink-0 items-center
            border-b border-white/[0.07]
            px-5
            ${collapsed ? "justify-center" : "justify-between"}
          `}
        >
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 items-center gap-3"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#39D5F2]/20 bg-[#0786AD]/10 shadow-lg shadow-[#0786AD]/10">
              <ShieldCheck
                size={21}
                className="text-[#39D5F2]"
              />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-bold tracking-wide text-white">
                  G-BYT
                </div>

                <div className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                  Administration
                </div>
              </div>
            )}
          </Link>

          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          {!collapsed && (
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
              Main menu
            </div>
          )}

          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const active = isNavigationActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-2.5
                    text-sm font-medium
                    transition-all duration-200
                    ${
                      collapsed
                        ? "lg:justify-center"
                        : ""
                    }
                    ${
                      active
                        ? "border border-[#0786AD]/20 bg-[#0786AD]/10 text-white shadow-lg shadow-[#0786AD]/5"
                        : "text-white/45 hover:bg-white/[0.045] hover:text-white/85"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`
                      shrink-0 transition-colors
                      ${
                        active
                          ? "text-[#39D5F2]"
                          : "text-white/35 group-hover:text-white/70"
                      }
                    `}
                  />

                  {!collapsed && (
                    <span className="truncate">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#39D5F2] shadow-[0_0_10px_rgba(57,213,242,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-5 h-px bg-white/[0.06]" />

          {!collapsed && (
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
              Management
            </div>
          )}

          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const active = isNavigationActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-2.5
                    text-sm font-medium
                    transition-all duration-200
                    ${
                      collapsed
                        ? "lg:justify-center"
                        : ""
                    }
                    ${
                      active
                        ? "border border-[#0786AD]/20 bg-[#0786AD]/10 text-white shadow-lg shadow-[#0786AD]/5"
                        : "text-white/45 hover:bg-white/[0.045] hover:text-white/85"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`
                      shrink-0 transition-colors
                      ${
                        active
                          ? "text-[#39D5F2]"
                          : "text-white/35 group-hover:text-white/70"
                      }
                    `}
                  />

                  {!collapsed && (
                    <span className="truncate">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#39D5F2] shadow-[0_0_10px_rgba(57,213,242,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Logout */}
        <div className="shrink-0 border-t border-white/[0.07] p-3">
          {!collapsed && user && (
            <div className="mb-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0786AD] to-[#05647F] text-xs font-bold text-white shadow-lg shadow-[#0786AD]/10">
                  {(
                    user.first_name?.[0] ||
                    user.email?.[0] ||
                    "A"
                  ).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-white">
                    {user.first_name || user.email}
                  </div>

                  <div className="truncate text-[10px] text-white/35">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />

                <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-300/70">
                  Administrator
                </span>
              </div>
            </div>
          )}

          {/* Functional logout button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={collapsed ? "Sign out" : undefined}
            aria-label={
              isLoggingOut
                ? "Signing out"
                : "Sign out"
            }
            className={`
              flex w-full items-center gap-3 rounded-xl
              px-3 py-2.5
              text-sm
              text-white/45
              transition-all duration-200
              hover:bg-red-400/10
              hover:text-red-300
              focus:outline-none
              focus:ring-2
              focus:ring-red-400/30
              disabled:cursor-not-allowed
              disabled:opacity-50
              ${collapsed ? "lg:justify-center" : ""}
            `}
          >
            <LogOut
              size={17}
              className={
                isLoggingOut
                  ? "animate-pulse"
                  : ""
              }
            />

            {!collapsed && (
              <span>
                {isLoggingOut
                  ? "Signing out..."
                  : "Sign out"}
              </span>
            )}
          </button>
        </div>

        {/* Desktop collapse button */}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className="absolute -right-3 top-[88px] hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0b1118] text-white/45 shadow-lg transition hover:border-[#0786AD]/30 hover:text-white lg:flex"
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN AREA                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`
          min-h-screen
          transition-[padding] duration-300
          ${collapsed ? "lg:pl-[84px]" : "lg:pl-[270px]"}
        `}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#05090e]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2.5 text-white/50 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/25">
                G-BYT Admin
              </div>

              <div className="mt-0.5 text-sm font-semibold text-white">
                {allNavigation.find(
                  (item) => isNavigationActive(item.href),
                )?.label || "Administration"}
              </div>
            </div>
          </div>

          {/* Header user */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium text-white/75">
                {user.first_name || "Administrator"}
              </div>

              <div className="text-[10px] text-white/30">
                Administrator
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0786AD]/20 bg-[#0786AD]/10 text-xs font-bold text-[#39D5F2]">
              {(
                user.first_name?.[0] ||
                user.email?.[0] ||
                "A"
              ).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}