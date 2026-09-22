"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { apiGet } from "@/lib/api/client";

type PaymentVerificationResponse = {
  order_number: string;
  payment_reference: string;
  payment_status: string;
  order_status: string;
  gateway_status: string;
};

type PageState = "verifying" | "success" | "error";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] =
    useState<PageState>("verifying");

  const [message, setMessage] = useState(
    "Confirming your payment..."
  );

  const [orderNumber, setOrderNumber] =
    useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) {
      setState("error");
      setMessage(
        "No payment reference was returned. We could not verify this transaction."
      );
      return;
    }

    let cancelled = false;

    async function verifyPayment() {
      try {
        setState("verifying");
        setMessage("Confirming your payment...");

        const result =
          await apiGet<PaymentVerificationResponse>(
            `/payments/verify/${encodeURIComponent(
              reference
            )}/`,
            true
          );

        if (cancelled) {
          return;
        }

        if (
          result.payment_status === "SUCCESS" &&
          result.gateway_status === "success"
        ) {
          setOrderNumber(result.order_number);
          setState("success");
          setMessage(
            "Your payment was successful and your order has been confirmed."
          );

          window.setTimeout(() => {
            router.replace(
              `/orders/${encodeURIComponent(
                result.order_number
              )}`
            );
          }, 1800);

          return;
        }

        setState("error");
        setMessage(
          "We received a response, but the payment could not be confirmed."
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Paystack payment verification failed:",
          error
        );

        setState("error");
        setMessage(
          "We could not verify your payment right now. Please check your orders before attempting another payment."
        );
      }
    }

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  function goToOrders() {
    router.replace("/account/orders");
  }

  function goHome() {
    router.replace("/");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] px-5 py-16 text-slate-900 dark:bg-[#05090e] dark:text-white">
      {/* Ambient G-BYT glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#39D5F2]/10 blur-3xl" />

        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-[#0786AD]/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39D5F2]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-10 dark:border-white/10 dark:bg-white/[0.045]">

          {/* VERIFYING */}
          {state === "verifying" && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E3F8FC] text-[#0786AD] dark:bg-[#0786AD]/10 dark:text-[#39D5F2]">
                <Loader2
                  size={34}
                  className="animate-spin"
                />
              </div>

              <h1 className="mt-7 text-2xl font-black tracking-tight sm:text-3xl">
                Verifying your payment
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Please wait while we securely confirm your
                Paystack transaction. Do not close this page.
              </p>

              <div className="mx-auto mt-8 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-[#0786AD]" />
              </div>
            </>
          )}

          {/* SUCCESS */}
          {state === "success" && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 size={40} />
              </div>

              <h1 className="mt-7 text-2xl font-black tracking-tight sm:text-3xl">
                Payment successful
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {message}
              </p>

              {orderNumber && (
                <div className="mx-auto mt-6 w-fit rounded-2xl border border-[#0786AD]/10 bg-[#E3F8FC]/60 px-5 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Order number
                  </p>

                  <p className="mt-1 font-black text-[#05647F] dark:text-[#39D5F2]">
                    {orderNumber}
                  </p>
                </div>
              )}

              <p className="mt-7 text-xs text-slate-400">
                Redirecting you to your order...
              </p>
            </>
          )}

          {/* ERROR */}
          {state === "error" && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle size={40} />
              </div>

              <h1 className="mt-7 text-2xl font-black tracking-tight sm:text-3xl">
                Payment verification
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {message}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={goToOrders}
                  className="inline-flex items-center justify-center rounded-xl bg-[#0786AD] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0786AD]/20 transition hover:bg-[#05647F]"
                >
                  View my orders
                </button>

                <button
                  type="button"
                  onClick={goHome}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#0786AD]/30 hover:text-[#0786AD] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:text-[#39D5F2]"
                >
                  Return home
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}