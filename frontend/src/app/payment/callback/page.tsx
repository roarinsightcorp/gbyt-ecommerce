import { Suspense } from "react";

import PaymentCallbackContent from "./page-content";

function PaymentCallbackLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] px-5 py-16 text-slate-900 dark:bg-[#05090e] dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#39D5F2]/10 blur-3xl" />

        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-[#0786AD]/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39D5F2]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-10 dark:border-white/10 dark:bg-white/[0.045]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E3F8FC] dark:bg-[#0786AD]/10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0786AD]/20 border-t-[#0786AD] dark:border-[#39D5F2]/20 dark:border-t-[#39D5F2]" />
          </div>

          <h1 className="mt-7 text-2xl font-black tracking-tight sm:text-3xl">
            Confirming your payment
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Please wait while we securely verify your transaction.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackLoading />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}