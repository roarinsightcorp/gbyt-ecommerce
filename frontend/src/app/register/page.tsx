
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import next from "next/dist/server/next";

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/account");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim();

    if (!cleanFirstName) {
      setError("Please enter your first name.");
      return;
    }

    if (!cleanLastName) {
      setError("Please enter your last name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: cleanEmail,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        password,
        password_confirm: passwordConfirm,
      });

      router.replace( "/account");
    } catch (err) {
      console.error("Registration failed:", err);

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
            (value) =>
              Array.isArray(value) && value.length > 0
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
          : "Unable to create your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-[120px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-[var(--primary-glow)]/5 blur-[100px]"
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
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Join G-BYT and start shopping with us today.
              </p>
            </div>

            {/* Error */}
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
              {/* Names */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
                  >
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    placeholder="John"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
                  >
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    placeholder="Doe"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

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
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="At least 8 characters"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 pr-12 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                  >
                    {showPassword ? "◉" : "○"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type={
                      showPasswordConfirm
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={passwordConfirm}
                    onChange={(event) =>
                      setPasswordConfirm(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter your password"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 pr-12 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordConfirm(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPasswordConfirm
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                  >
                    {showPasswordConfirm ? "◉" : "○"}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="ml-2 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Login */}
            <div className="mt-7 border-t border-[var(--border)] pt-6 text-center">
              <p className="text-sm text-[var(--muted)]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[var(--primary)] transition hover:text-[var(--primary-deep)]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">
            By creating an account, you agree to the G-BYT
            terms and privacy policy.
          </p>
        </div>
      </div>
    </main>
  );
}