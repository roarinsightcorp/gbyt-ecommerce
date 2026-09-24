import { Suspense } from "react";

import ProductsContent from "./page-content";

function ProductsLoading() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--primaryGlow)]/10 blur-3xl" />

        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="h-7 w-32 animate-pulse rounded-full bg-[var(--surface-muted)]" />

            <div className="mt-6 h-12 w-full max-w-2xl animate-pulse rounded-2xl bg-[var(--surface-muted)] sm:h-16" />

            <div className="mt-3 h-12 w-3/4 max-w-xl animate-pulse rounded-2xl bg-[var(--surface-muted)] sm:h-16" />

            <div className="mt-5 h-12 w-full max-w-2xl animate-pulse rounded-xl bg-[var(--surface-muted)]" />
          </div>

          <div className="mt-10 h-16 w-full animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-64 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)]" />

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="aspect-square animate-pulse bg-[var(--surface-muted)]" />

                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--surface-muted)]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
                  <div className="h-10 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}