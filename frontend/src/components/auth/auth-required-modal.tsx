"use client";

interface AuthRequiredModalProps {
open: boolean;
onClose: () => void;
onSignIn: () => void;
onCreateAccount: () => void;
}

export default function AuthRequiredModal({
open,
onClose,
onSignIn,
onCreateAccount,
}: AuthRequiredModalProps) {
if (!open) {
return null;
}

return ( <div
   className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-md"
   onMouseDown={onClose}
 >
<div
role="dialog"
aria-modal="true"
aria-labelledby="auth-required-title"
className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_100px_rgba(3,70,91,0.22)]"
onMouseDown={(event) => event.stopPropagation()}
> <div className="absolute inset-x-0 top-0 h-1 bg-[var(--primary)]" />


    <div className="p-7 sm:p-8">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xl text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        ×
      </button>

      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[0_8px_30px_rgba(8,126,164,0.12)]">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 12V8.5C20 7.67 19.33 7 18.5 7H5.5C4.67 7 4 7.67 4 8.5V18.5C4 19.33 4.67 20 5.5 20H18.5C19.33 20 20 19.33 20 18.5V17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M15 12H21M18 9L21 12L18 15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="pr-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          G-BYT Account
        </p>

        <h2
          id="auth-required-title"
          className="text-2xl font-bold tracking-tight text-[var(--foreground)]"
        >
          Sign in to add to your cart
        </h2>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          To add products to your cart, you need to sign in
          to your G-BYT account. If you don't have an account
          yet, you can create one in just a few moments.
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-2xl bg-[var(--primary)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(8,126,164,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-deep)]"
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={onCreateAccount}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          Create Account
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        Continue browsing
      </button>
    </div>
  </div>
</div>

);
}
