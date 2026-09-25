
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { useAuthContext } from "@/providers/auth-provider";

const navigation = [
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
    icon: Boxes,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: ClipboardList,
  },
];

const secondaryNavigation = [
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-[#05090e] text-white">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-white/[0.07] bg-[#070c12]/95 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } ${
          collapsed ? "lg:w-[82px]" : "lg:w-[270px]"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center border-b border-white/[0.07] px-5">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(57,213,242,0.08)]">
              <Shield size={21} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-wide text-white">
                  G-BYT
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300/60">
                  Administration
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p
            className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            Management
          </p>

          <div className="space-y-1">
            {navigation.map((item) => (
              <AdminNavItem
                key={item.href}
                {...item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>

          <div className="my-5 h-px bg-white/[0.06]" />

          <p
            className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            System
          </p>

          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <AdminNavItem
                key={item.href}
                {...item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>
        </nav>

        {/* User area */}
        <div className="border-t border-white/[0.07] p-3">
          <div
            className={`mb-2 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-300">
              {user?.first_name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "A"}
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user?.first_name || "Administrator"}
                </p>
                <p className="truncate text-xs text-white/35">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-red-400/10 hover:text-red-300 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <LogOut size={17} />

            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-[88px] hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#101820] text-white/50 shadow-lg transition hover:text-white lg:flex"
          aria-label={
            collapsed
              ? "Expand navigation"
              : "Collapse navigation"
          }
        >
          <ChevronLeft
            size={14}
            className={`transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </aside>

      {/* Main area */}
      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[82px]" : "lg:pl-[270px]"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/[0.07] bg-[#05090e]/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-white/60 transition hover:text-white lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu size={19} />
          </button>

          <div className="ml-3 lg:hidden">
            <p className="text-sm font-semibold text-white">
              G-BYT Admin
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[11px] font-medium text-emerald-300/80">
                Admin Mode
              </span>
            </div>

            <Link
              href="/"
              className="hidden rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/50 transition hover:bg-white/[0.06] hover:text-white sm:block"
            >
              View Store
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function AdminNavItem({
  label,
  href,
  icon: Icon,
  pathname,
  collapsed,
  onNavigate,
}: {
  label: string;
  href: string;
  icon: typeof Users;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const isActive =
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href ||
        pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        isActive
          ? "bg-cyan-400/10 text-cyan-300 shadow-[inset_0_0_20px_rgba(57,213,242,0.025)]"
          : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
      } ${collapsed ? "lg:justify-center" : ""}`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(57,213,242,0.5)]" />
      )}

      <Icon
        size={18}
        className={`shrink-0 ${
          isActive
            ? "text-cyan-300"
            : "text-white/35 group-hover:text-white/70"
        }`}
      />

      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );
}
