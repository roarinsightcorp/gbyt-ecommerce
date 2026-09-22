
"use client";



import { Glass } from "@/components/ui/glass";
import ThemeToggle from "@/components/theme/theme-toggle";

import { useEffect, useState } from "react";
import { getCategories } from "@/lib/api/products";
import type { Category } from "@/types/product";



const benefits = [
  {
    number: "01",
    title: "Thoughtfully selected",
    description:
      "Products chosen with quality, usefulness and everyday value in mind.",
  },
  {
    number: "02",
    title: "Simple shopping",
    description:
      "A clean, focused experience from discovering a product to checkout.",
  },
  {
    number: "03",
    title: "Built for everyone",
    description:
      "Products and publications designed to fit different lifestyles and needs.",
  },
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 10h11M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 15 15 5M7 5h8v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomePage() {
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);

        const response = await getCategories();

        if (mounted) {
          setCategories(response.results);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);

        if (mounted) {
          setCategoriesError("Unable to load categories.");
        }
      } finally {
        if (mounted) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">

      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <header className="sticky top-0 z-[1100] px-3 pt-3 sm:px-5 sm:pt-5">
        <Glass
          intensity="medium"
          glow={false}
          hover={false}
          animated
          className="mx-auto max-w-7xl px-4 py-3 sm:px-5"
        >
          <div className="flex items-center justify-between gap-4">

            {/* Brand */}
            <a
              href="/"
              className="group flex min-w-0 items-center gap-3"
              aria-label="G by T home"
            >
              <div
                className="
                  relative flex h-10 w-10 shrink-0 items-center justify-center
                  overflow-hidden rounded-xl
                  bg-[var(--primary)]
                  text-sm font-black text-white
                  shadow-[0_8px_24px_rgba(8,126,164,0.25)]
                  transition-transform duration-300
                  group-hover:scale-105
                "
              >
                <span className="relative z-10">G</span>

                <span
                  className="
                    absolute inset-0
                    bg-gradient-to-br
                    from-white/25
                    via-transparent
                    to-transparent
                  "
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-tight sm:text-base">
                  G by T
                </p>

                <p className="hidden truncate text-[10px] font-medium tracking-wide text-[var(--muted)] sm:block">
                  GLOBAL TRADING VENTURES
                </p>
              </div>
            </a>

            {/* Desktop navigation */}
            <nav className="hidden items-center gap-8 lg:flex">
              <a
                href="/products"
                className="
                  relative text-sm font-medium text-[var(--muted)]
                  transition-colors duration-200
                  hover:text-[var(--foreground)]
                  after:absolute after:-bottom-2 after:left-0 after:h-px
                  after:w-0 after:bg-[var(--primary)]
                  after:transition-all
                  hover:after:w-full
                "
              >
                Shop
              </a>

              <a
                href="/products?category=stationery"
                className="
                  relative text-sm font-medium text-[var(--muted)]
                  transition-colors duration-200
                  hover:text-[var(--foreground)]
                  after:absolute after:-bottom-2 after:left-0 after:h-px
                  after:w-0 after:bg-[var(--primary)]
                  after:transition-all
                  hover:after:w-full
                "
              >
                Stationery
              </a>

              <a
                href="/products?category=books"
                className="
                  relative text-sm font-medium text-[var(--muted)]
                  transition-colors duration-200
                  hover:text-[var(--foreground)]
                  after:absolute after:-bottom-2 after:left-0 after:h-px
                  after:w-0 after:bg-[var(--primary)]
                  after:transition-all
                  hover:after:w-full
                "
              >
                Books
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              <a
                href="/cart"
                className="
                  hidden items-center gap-2 rounded-xl
                  bg-[var(--primary)]
                  px-4 py-2.5
                  text-sm font-semibold text-white
                  shadow-[0_8px_24px_rgba(8,126,164,0.20)]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-[var(--primary-deep)]
                  hover:shadow-[0_12px_30px_rgba(8,126,164,0.28)]
                  sm:flex
                "
              >
                Cart
                <ArrowUpRightIcon />
              </a>

              <button
                type="button"
                aria-label="Open navigation menu"
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-xl border border-[var(--border)]
                  bg-[var(--surface)]
                  text-[var(--foreground)]
                  transition-colors
                  hover:border-[var(--primary)]
                  hover:text-[var(--primary)]
                  lg:hidden
                "
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </Glass>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative isolate">

        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="
              absolute -right-40 -top-48
              h-[620px] w-[620px]
              rounded-full
              bg-[var(--primary-glow)]
              opacity-[0.10]
              blur-[130px]
            "
          />

          <div
            className="
              absolute -left-48 top-[35%]
              h-[520px] w-[520px]
              rounded-full
              bg-[var(--accent)]
              opacity-[0.055]
              blur-[140px]
            "
          />

          <div
            className="
              absolute right-[20%] top-[48%]
              h-72 w-72
              rounded-full
              bg-[var(--primary)]
              opacity-[0.035]
              blur-[100px]
            "
          />

          {/* subtle grid */}
          <div
            className="
              absolute inset-0 opacity-[0.025]
              [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)]
              [background-size:64px_64px]
            "
          />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-36">

          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">

            {/* Hero copy */}
            <div className="max-w-4xl">

              {/* Status pill */}
              <div
                className="
                  mb-7 inline-flex items-center gap-2.5
                  rounded-full
                  border border-[var(--border)]
                  bg-[var(--surface-soft)]
                  px-4 py-2
                  text-xs font-semibold
                  text-[var(--muted)]
                  shadow-[0_8px_30px_rgba(7,21,29,0.04)]
                  backdrop-blur-xl
                "
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="
                      absolute inline-flex h-full w-full
                      animate-ping rounded-full
                      bg-[var(--primary-glow)]
                      opacity-60
                    "
                  />

                  <span
                    className="
                      relative inline-flex h-2.5 w-2.5
                      rounded-full
                      bg-[var(--primary)]
                      shadow-[0_0_14px_var(--primary-glow)]
                    "
                  />
                </span>

                Quality products. Simply delivered.
              </div>

              {/* Main heading */}
              <h1
                className="
                  max-w-4xl
                  text-5xl font-black
                  leading-[0.95]
                  tracking-[-0.055em]
                  sm:text-6xl
                  md:text-7xl
                  lg:text-[clamp(4.5rem,7.5vw,7.5rem)]
                "
              >
                Things worth
                <span
                  className="
                    block
                    bg-gradient-to-r
                    from-[var(--primary)]
                    via-[var(--primary-glow)]
                    to-[var(--accent)]
                    bg-clip-text
                    text-transparent
                  "
                >
                  having.
                </span>
              </h1>

              <p
                className="
                  mt-8 max-w-2xl
                  text-base leading-7
                  text-[var(--muted)]
                  sm:text-lg sm:leading-8
                  lg:text-xl
                "
              >
                Discover thoughtfully selected stationery,
                books and digital publications from G by T
                Global Trading Ventures — made for work,
                learning, creativity and everyday life.
              </p>

              {/* CTA */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">

                <a
                  href="/products"
                  className="
                    group inline-flex items-center justify-center gap-3
                    rounded-xl
                    bg-[var(--primary)]
                    px-6 py-3.5
                    text-sm font-bold text-white
                    shadow-[0_14px_35px_rgba(8,126,164,0.24)]
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:bg-[var(--primary-deep)]
                    hover:shadow-[0_18px_42px_rgba(8,126,164,0.32)]
                    sm:px-7 sm:py-4
                  "
                >
                  Explore the store

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowIcon />
                  </span>
                </a>

                <a
                  href="/products?category=books"
                  className="
                    inline-flex items-center justify-center
                    rounded-xl
                    border border-[var(--border)]
                    bg-[var(--surface-soft)]
                    px-6 py-3.5
                    text-sm font-semibold
                    backdrop-blur-xl
                    transition-all duration-300
                    hover:-translate-y-0.5
                    hover:border-[var(--primary)]
                    hover:text-[var(--primary)]
                    sm:px-7 sm:py-4
                  "
                >
                  Browse books
                </a>
              </div>

              {/* Trust strip */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <span className="text-[var(--success)]">✓</span>
                  Quality-focused
                </span>

                <span className="hidden h-1 w-1 rounded-full bg-[var(--border-strong)] sm:block" />

                <span className="flex items-center gap-2">
                  <span className="text-[var(--success)]">✓</span>
                  Simple shopping
                </span>

                <span className="hidden h-1 w-1 rounded-full bg-[var(--border-strong)] sm:block" />

                <span className="flex items-center gap-2">
                  <span className="text-[var(--success)]">✓</span>
                  Digital & physical
                </span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative hidden lg:block">

              <div
                className="
                  absolute -inset-8
                  rounded-[40px]
                  bg-[var(--primary-glow)]
                  opacity-[0.08]
                  blur-[70px]
                "
              />

              <Glass
                intensity="soft"
                glow
                hover
                animated
                className="relative min-h-[460px] rounded-[32px] p-7"
              >
                <div className="flex h-full min-h-[406px] flex-col justify-between">

                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                        G by T
                      </p>

                      <p className="mt-2 text-sm text-[var(--muted)]">
                        Curated essentials
                      </p>
                    </div>

                    <div className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Since 2026
                    </div>
                  </div>

                  {/* Abstract product composition */}
                  <div className="relative flex flex-1 items-center justify-center">

                    <div
                      className="
                        absolute h-52 w-52
                        rounded-full
                        bg-[var(--primary-glow)]
                        opacity-20
                        blur-3xl
                      "
                    />

                    <div
                      className="
                        relative flex h-64 w-48
                        rotate-[-8deg]
                        items-end
                        justify-center
                        rounded-[22px]
                        border border-white/20
                        bg-gradient-to-br
                        from-[var(--primary)]
                        via-[var(--primary-deep)]
                        to-[var(--primary-dark)]
                        p-6
                        shadow-[0_30px_70px_rgba(3,70,91,0.28)]
                        transition-transform duration-500
                        hover:rotate-[-4deg]
                      "
                    >
                      <div className="absolute left-5 right-5 top-6 h-px bg-white/20" />

                      <div className="w-full">
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/60">
                          G by T
                        </p>

                        <p className="mt-12 text-3xl font-black leading-none tracking-tight text-white">
                          Ideas
                          <br />
                          matter.
                        </p>

                        <div className="mt-8 h-1 w-10 rounded-full bg-[var(--primary-glow)]" />
                      </div>
                    </div>

                    <div
                      className="
                        absolute right-[12%] top-[28%]
                        h-24 w-20
                        rotate-[12deg]
                        rounded-2xl
                        border border-[var(--border)]
                        bg-[var(--surface-elevated)]
                        p-3
                        shadow-[0_20px_40px_rgba(7,21,29,0.12)]
                      "
                    >
                      <div className="space-y-2">
                        <div className="h-1.5 w-8 rounded-full bg-[var(--primary)]" />
                        <div className="h-1 w-12 rounded-full bg-[var(--border-strong)]" />
                        <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
                        <div className="h-1 w-7 rounded-full bg-[var(--border-strong)]" />
                      </div>
                    </div>

                    <div
                      className="
                        absolute bottom-[18%] left-[9%]
                        h-16 w-16
                        rotate-[-14deg]
                        rounded-2xl
                        border border-[var(--border)]
                        bg-[var(--surface-elevated)]
                        shadow-[0_20px_40px_rgba(7,21,29,0.10)]
                      "
                    />
                  </div>

                  {/* Bottom */}
                  <div className="flex items-end justify-between border-t border-[var(--border)] pt-5">
                    <div>
                      <p className="text-2xl font-black tracking-tight">
                        Quality
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Without the unnecessary.
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                      <ArrowUpRightIcon />
                    </div>
                  </div>
                </div>
              </Glass>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CATEGORY SECTION
      ========================================================= */}
      <section className="relative mx-auto max-w-7xl px-5 pb-28 sm:px-6 lg:pb-36">

        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              Explore
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              Shop by category
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              Start with what interests you and discover products
              selected for everyday usefulness.
            </p>
          </div>

          <a
            href="/products"
            className="
              group inline-flex items-center gap-2
              text-sm font-semibold
              text-[var(--primary)]
              transition-colors
              hover:text-[var(--primary-deep)]
            "
          >
            View all products
            <span className="transition-transform group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </a>
        </div>

        
        <div className="grid gap-5 md:grid-cols-2">

          {categoriesLoading ? (
            <>
              {[1, 2].map((item) => (
                <Glass
                  key={item}
                  className="
                    min-h-[350px]
                    rounded-[28px]
                    p-7
                    sm:p-9
                    animate-pulse
                  "
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="h-3 w-8 rounded bg-[var(--border)]" />

                      <div className="mt-16 h-10 w-48 rounded bg-[var(--border)]" />

                      <div className="mt-5 h-4 w-full max-w-md rounded bg-[var(--border)]" />

                      <div className="mt-2 h-4 w-4/5 max-w-md rounded bg-[var(--border)]" />
                    </div>

                    <div className="mt-10 h-5 w-36 rounded bg-[var(--border)]" />
                  </div>
                </Glass>
              ))}
            </>
          ) : categoriesError ? (
            <Glass
              className="
                col-span-full
                rounded-[28px]
                p-8
              "
            >
              <p className="text-sm font-semibold text-[var(--muted)]">
                {categoriesError}
              </p>

              <a
                href="/products"
                className="mt-4 inline-flex text-sm font-bold text-[var(--primary)]"
              >
                Browse all products
              </a>
            </Glass>
          ) : categories.length === 0 ? (
            <Glass
              className="
                col-span-full
                rounded-[28px]
                p-8
              "
            >
              <p className="text-sm text-[var(--muted)]">
                No categories are currently available.
              </p>
            </Glass>
          ) : (
            categories.map((category, index) => (
              <Glass
                key={category.id}
                glow
                hover
                animated
                className="
                  group
                  min-h-[350px]
                  rounded-[28px]
                  p-7
                  sm:p-9
                "
              >
                <div className="flex h-full flex-col justify-between">

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold tracking-[0.18em] text-[var(--primary)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        className="
                          rounded-full
                          border border-[var(--border)]
                          bg-[var(--surface-soft)]
                          px-3 py-1.5
                          text-[10px] font-semibold uppercase tracking-wider
                          text-[var(--muted)]
                        "
                      >
                        {category.name}
                      </span>
                    </div>

                    <h3
                      className="
                        mt-16
                        text-3xl font-black
                        tracking-[-0.035em]
                        transition-transform duration-500
                        group-hover:translate-x-1
                        sm:text-4xl
                      "
                    >
                      {category.name}
                    </h3>

                    <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)] sm:text-base">
                      {category.description ||
                        `Explore our ${category.name.toLowerCase()} collection.`}
                    </p>
                  </div>

                  <a
                    href={`/products?category=${encodeURIComponent(category.slug)}`}
                    className="
                      mt-10 inline-flex w-fit
                      items-center gap-2
                      text-sm font-bold
                      text-[var(--primary)]
                    "
                  >
                    Explore collection

                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowIcon />
                    </span>
                  </a>
                </div>
              </Glass>
            ))
          )}

        </div>

      </section>

      {/* =========================================================
          BRAND / VALUE SECTION
      ========================================================= */}
      <section className="relative border-y border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="
              absolute left-1/2 top-1/2
              h-[500px] w-[500px]
              -translate-x-1/2 -translate-y-1/2
              rounded-full
              bg-[var(--primary-glow)]
              opacity-[0.035]
              blur-[120px]
            "
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:py-32">

          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                The G by T approach
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Less noise.
                <span className="block text-[var(--primary)]">
                  More value.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-[var(--muted)] sm:text-base">
                We believe shopping should feel simple. Find useful
                products, discover worthwhile ideas and get what you
                need without unnecessary complexity.
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {benefits.map((benefit) => (
                <div
                  key={benefit.number}
                  className="
                    group
                    grid gap-4 py-7
                    sm:grid-cols-[70px_1fr]
                  "
                >
                  <span className="text-xs font-bold tracking-widest text-[var(--primary)]">
                    {benefit.number}
                  </span>

                  <div>
                    <h3 className="text-xl font-bold tracking-tight">
                      {benefit.title}
                    </h3>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:py-32">

        <Glass
          intensity="medium"
          glow
          hover={false}
          animated
          className="relative overflow-hidden rounded-[32px] p-8 sm:p-12 lg:p-16"
        >
          <div className="relative z-10 max-w-3xl">

            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              Start exploring
            </p>

            <h2
              className="
                mt-4
                text-4xl font-black
                leading-tight
                tracking-[-0.045em]
                sm:text-5xl
                lg:text-6xl
              "
            >
              Find something
              <span className="text-[var(--primary)]"> worth having.</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Explore the G by T collection and discover stationery,
              books and publications selected with purpose.
            </p>

            <a
              href="/products"
              className="
                mt-8 inline-flex items-center gap-3
                rounded-xl
                bg-[var(--primary)]
                px-6 py-3.5
                text-sm font-bold text-white
                shadow-[0_14px_35px_rgba(8,126,164,0.22)]
                transition-all duration-300
                hover:-translate-y-1
                hover:bg-[var(--primary-deep)]
                sm:px-7 sm:py-4
              "
            >
              Shop now
              <ArrowIcon />
            </a>
          </div>

          <div
            className="
              pointer-events-none absolute
              -right-24 -top-32
              h-80 w-80
              rounded-full
              bg-[var(--primary-glow)]
              opacity-[0.10]
              blur-[90px]
            "
          />

          <div
            className="
              pointer-events-none absolute
              -bottom-32 right-1/4
              h-64 w-64
              rounded-full
              bg-[var(--accent)]
              opacity-[0.06]
              blur-[90px]
            "
          />
        </Glass>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-[var(--border)]">

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-9 w-9 items-center justify-center
                    rounded-xl
                    bg-[var(--primary)]
                    text-xs font-black text-white
                  "
                >
                  G
                </div>

                <div>
                  <p className="text-sm font-black">G by T</p>
                  <p className="text-[10px] text-[var(--muted)]">
                    Global Trading Ventures
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-xs text-sm leading-6 text-[var(--muted)]">
                Quality products, useful ideas and a simpler way
                to discover what matters.
              </p>
            </div>

            {/* Shop */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">
                Shop
              </p>

              <div className="mt-4 space-y-3">
                <a
                  href="/products"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  All products
                </a>

                <a
                  href="/products?category=stationery"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  Stationery
                </a>

                <a
                  href="/products?category=books"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  Books
                </a>
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">
                Account
              </p>

              <div className="mt-4 space-y-3">
                <a
                  href="/login"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  Sign in
                </a>

                <a
                  href="/register"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  Create account
                </a>

                <a
                  href="/orders"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  Orders
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">
                Company
              </p>

              <div className="mt-4 space-y-3">
                <a
                  href="/"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  About G by T
                </a>

                <a
                  href="/cart"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  Your cart
                </a>

                <a
                  href="/products"
                  className="block text-sm text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
                >
                  Store
                </a>
              </div>
            </div>
          </div>

          <div
            className="
              mt-12 flex flex-col gap-3
              border-t border-[var(--border)]
              pt-6
              text-xs text-[var(--muted)]
              sm:flex-row sm:items-center sm:justify-between
            "
          >
            <p>
              © {new Date().getFullYear()} G by T Global Trading Ventures.
              All rights reserved.
            </p>

            <p>
              Quality. Simplicity. Delivered.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
