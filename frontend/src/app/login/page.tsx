import { Suspense } from "react";

import LoginForm from "./login-form";

function LoginLoading() {
  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-[120px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[var(--primary-glow)]/5 blur-[100px]"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-176px)] max-w-md items-center justify-center">
        <div className="w-full text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-[var(--primary)]/20" />

          <div className="mx-auto mt-6 h-8 w-48 animate-pulse rounded-lg bg-[var(--border)]" />

          <div className="mx-auto mt-3 h-4 w-64 animate-pulse rounded-lg bg-[var(--border)]" />

          <div className="mt-8 h-96 animate-pulse rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]/70" />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}