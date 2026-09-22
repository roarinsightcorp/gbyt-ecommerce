"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
FormEvent,
useEffect,
useState,
} from "react";

import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
const router = useRouter();
const searchParams = useSearchParams();

const {
login,
isAuthenticated,
isLoading: authLoading,
} = useAuth();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [showPassword, setShowPassword] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState("");

useEffect(() => {
if (!authLoading && isAuthenticated) {
const next = searchParams.get("next");

  router.replace(next || "/account");
}


}, [
authLoading,
isAuthenticated,
router,
searchParams,
]);

const handleSubmit = async (
event: FormEvent<HTMLFormElement>
) => {
event.preventDefault();


setError("");

const cleanEmail = email.trim();

if (!cleanEmail) {
  setError("Please enter your email address.");
  return;
}

if (!password) {
  setError("Please enter your password.");
  return;
}

setIsSubmitting(true);

try {
  await login({
    email: cleanEmail,
    password,
  });

  const next = searchParams.get("next");

  router.replace(next || "/account");
} catch (err) {
  console.error("Login failed:", err);

  if (
    err &&
    typeof err === "object" &&
    "data" in err
  ) {
    const data = (
      err as {
        data?: Record<string, unknown> | null;
      }
    ).data;

    if (data) {
      const firstFieldError = Object.values(data).find(
        (value) => Array.isArray(value) && value.length > 0
      );

      if (Array.isArray(firstFieldError)) {
        setError(String(firstFieldError[0]));
        setIsSubmitting(false);
        return;
      }
    }
  }

  setError(
    err instanceof Error
      ? err.message
      : "Unable to sign in. Please check your credentials and try again."
  );
} finally {
  setIsSubmitting(false);
}


};

return ( <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
{/* Background glow */} <div
     aria-hidden="true"
     className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-[120px]"
   />


  <div
    aria-hidden="true"
    className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[var(--primary-glow)]/5 blur-[100px]"
  />

  <div className="relative mx-auto flex min-h-[calc(100vh-176px)] max-w-md items-center justify-center">
    <div className="w-full">
      {/* Brand */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-3"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-lg font-black text-white shadow-[0_12px_35px_rgba(8,126,164,0.25)]">
            G
          </span>

          <span className="text-xl font-black tracking-tight text-[var(--foreground)]">
            G-BYT
          </span>
        </Link>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          Your global trading partner
        </p>
      </div>

      {/* Card */}
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]/90 p-6 shadow-[0_25px_80px_rgba(3,70,91,0.12)] backdrop-blur-xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Sign in to your G-BYT account to continue
            shopping and manage your orders.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-600 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-[var(--foreground)]"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[var(--primary)] transition hover:text-[var(--primary-deep)]"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 pr-12 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 3L21 21"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10.6 10.7A2 2 0 0013.3 13.4M9.9 5.2A10.6 10.6 0 0112 5c5 0 8.5 4 9.5 6.5a12.4 12.4 0 01-3.2 4.5M6.2 6.2C4.1 7.6 2.9 9.7 2.5 11.5 3.5 15 7.8 19 12 19c1.4 0 2.7-.3 3.9-.8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(8,126,164,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-deep)] hover:shadow-[0_16px_35px_rgba(8,126,164,0.28)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span className="ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </button>
        </form>

        {/* Register */}
        <div className="mt-7 border-t border-[var(--border)] pt-6 text-center">
          <p className="text-sm text-[var(--muted)]">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-[var(--primary)] transition hover:text-[var(--primary-deep)]"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">
        By signing in, you agree to the G-BYT terms and
        privacy policy.
      </p>
    </div>
  </div>
</main>


);
}
