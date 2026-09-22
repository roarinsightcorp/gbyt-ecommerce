"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Moon,
  Settings,
  Sun,
} from "lucide-react";

import { useTheme } from "@/hooks/use-theme";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
  } = useTheme();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#39D5F2]/10 blur-3xl" />

        <div className="absolute -right-32 top-60 h-96 w-96 rounded-full bg-[#0786AD]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0786AD] dark:text-slate-400"
        >
          <ArrowLeft size={16} />
          Back to account
        </Link>

        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0786AD]/15 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#05647F] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-[#39D5F2]">
            <Settings size={14} />
            Account settings
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Personalize your G-BYT experience.
          </p>
        </div>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
              <Sun size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Appearance
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Choose how G-BYT looks for you.
                Your preference is saved on this
                device.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <ThemeOption
              active={theme === "light"}
              icon={<Sun size={22} />}
              title="Light"
              description="Bright, clean and glassy."
              onClick={() =>
                setTheme("light")
              }
            />

            <ThemeOption
              active={theme === "dark"}
              icon={<Moon size={22} />}
              title="Dark"
              description="Deep, refined and immersive."
              onClick={() =>
                setTheme("dark")
              }
            />
          </div>

          <div className="mt-6 rounded-2xl border border-[#0786AD]/10 bg-[#E3F8FC]/40 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Your theme preference applies across
              the entire G-BYT website — including
              products, cart, checkout, account,
              orders and payment pages.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ThemeOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300 ${
        active
          ? "border-[#0786AD]/40 bg-[#E3F8FC]/60 shadow-[0_12px_35px_rgba(7,134,173,0.10)] dark:border-[#39D5F2]/30 dark:bg-[#0786AD]/10"
          : "border-slate-200 bg-slate-50/70 hover:border-[#0786AD]/20 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-[#0786AD] text-white"
            : "bg-white text-slate-500 dark:bg-white/10 dark:text-slate-300"
        }`}
      >
        {icon}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-bold">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {active && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0786AD] text-white">
          <Check size={14} />
        </div>
      )}
    </button>
  );
}