
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  UserRound,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useAuthContext } from "@/providers/auth-provider";

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const { user, isLoading, isAuthenticated } = useAuthContext();

  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     AUTH GUARD
  ========================================================= */

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/account/profile");
    }
  }, [isLoading, isAuthenticated, router]);

  /* =========================================================
     LOAD USER
  ========================================================= */

  useEffect(() => {
    if (!user) return;

    setForm({
      firstName: user.first_name ?? "",
      lastName: user.last_name ?? "",
      email: user.email ?? "",
      phone: user.phone_number ?? "",
    });
  }, [user]);

  /* =========================================================
     FORM UPDATE
  ========================================================= */

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
    setError("");
  }

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  async function handleSave() {
    setError("");
    setSaved(false);

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    setSaving(true);

    try {
      /*
       * TODO:
       *
       * Connect this to the actual Django profile endpoint.
       *
       * Do not invent the backend contract here.
       */

      await new Promise((resolve) => setTimeout(resolve, 600));

      setSaved(true);
    } catch (err) {
      console.error("Failed to save profile:", err);

      setError(
        "We couldn't save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return <ProfileLoading />;
  }

  /* =========================================================
     PAGE
  ========================================================= */

  const initials =
    `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] text-[#0b1720] dark:bg-[#05090e] dark:text-[#f8fafc]">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-cyan-400/[0.08] blur-[130px]" />

        <div className="absolute right-[-220px] top-[18%] h-[550px] w-[550px] rounded-full bg-blue-500/[0.08] blur-[130px]" />

        <div className="absolute bottom-[-250px] left-[25%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(#0f172a 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">

        {/* =====================================================
            TOP NAV
        ===================================================== */}

        <div className="mb-8 flex items-center justify-between">

          <Link
            href="/account"
            className="group inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold !text-[#526774] transition hover:!text-[#087ea4] dark:!text-[#d2e0e7] dark:hover:!text-[#67e8f9]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Account
          </Link>

          <div className="hidden items-center gap-2 text-xs font-bold !text-[#70838e] sm:flex dark:!text-[#b7c9d2]">
            <ShieldCheck className="h-4 w-4 !text-emerald-500" />
            Account secured
          </div>

        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="mb-9">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">

            <UserRound className="h-3.5 w-3.5 !text-[#087ea4] dark:!text-[#67e8f9]" />

            <span className="text-[10px] font-black uppercase tracking-[0.2em] !text-[#087ea4] dark:!text-[#67e8f9]">
              My Account
            </span>

          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <h1 className="text-4xl font-black tracking-[-0.045em] !text-[#07141c] dark:!text-[#f8fafc] sm:text-5xl">
                Profile
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 !text-[#526774] dark:!text-[#c8d7df] sm:text-[15px]">
                Manage your personal information and the details associated
                with your G by T account.
              </p>

            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-4 py-2.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">

              <ShieldCheck className="h-4 w-4 !text-emerald-500" />

              <span className="text-xs font-bold !text-[#3d5662] dark:!text-[#d7e5eb]">
                Secure profile
              </span>

            </div>

          </div>

        </header>

        {/* =====================================================
            PROFILE HERO
        ===================================================== */}

        <section className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#0b1119]/95 sm:p-7">

          {/* Cyan glow */}

          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-[90px]" />

          <div className="pointer-events-none absolute bottom-[-120px] left-1/3 h-60 w-60 rounded-full bg-blue-500/[0.06] blur-[80px]" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            {/* Identity */}

            <div className="flex items-center gap-5">

              <div className="relative shrink-0">

                <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[#05627F] via-[#087EA4] to-[#36C5E8] text-2xl font-black text-white shadow-xl shadow-cyan-900/20">
                  {initials || <User className="h-8 w-8" />}
                </div>

                <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white dark:border-[#0b1119]">
                  <Check className="h-3 w-3" />
                </div>

              </div>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-xl font-black tracking-tight !text-[#07141c] dark:!text-[#f8fafc]">
                    {form.firstName || "Your"}{" "}
                    {form.lastName || "Profile"}
                  </h2>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider !text-emerald-600 dark:!text-emerald-400">
                    Active
                  </span>

                </div>

                <p className="mt-1 truncate text-sm !text-[#526774] dark:!text-[#c8d7df]">
                  {form.email || "Your account"}
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <Sparkles className="h-3.5 w-3.5 !text-[#087ea4] dark:!text-[#67e8f9]" />

                  <p className="text-xs font-bold !text-[#087ea4] dark:!text-[#67e8f9]">
                    G by T Customer
                  </p>

                </div>

              </div>

            </div>

            {/* Security badge */}

            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/15 dark:bg-emerald-500/[0.06]">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <LockKeyhole className="h-5 w-5 !text-emerald-600 dark:!text-emerald-400" />
              </div>

              <div>

                <p className="text-[10px] font-black uppercase tracking-wider !text-[#647780] dark:!text-[#9fb3bd]">
                  Account Security
                </p>

                <p className="mt-0.5 text-sm font-black !text-[#172c36] dark:!text-[#f0f8fb]">
                  Protected
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_380px]">

          {/* ===================================================
              PROFILE FORM
          =================================================== */}

          <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#0b1119]/95 sm:p-7">

            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/[0.07] blur-[75px]" />

            <div className="relative">

              {/* Section header */}

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#05627F] to-[#36C5E8] text-white shadow-lg shadow-cyan-900/10">
                  <User className="h-5 w-5" />
                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-[#087ea4] dark:!text-[#67e8f9]">
                    Personal Details
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight !text-[#07141c] dark:!text-[#f8fafc]">
                    Your Information
                  </h2>

                  <p className="mt-1 text-xs !text-[#5c707b] dark:!text-[#b8cbd4]">
                    Keep your account information up to date.
                  </p>

                </div>

              </div>

              {/* Error */}

              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 !text-red-700 dark:border-red-500/20 dark:bg-red-500/[0.06] dark:!text-red-300">

                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p className="text-xs font-bold leading-5">
                    {error}
                  </p>

                </div>
              )}

              {/* Success */}

              {saved && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 !text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06] dark:!text-emerald-300">

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>

                  <p className="text-xs font-bold">
                    Your profile has been updated successfully.
                  </p>

                </div>
              )}

              {/* Fields */}

              <div className="mt-7 grid gap-5 sm:grid-cols-2">

                <ProfileInput
                  label="First Name"
                  value={form.firstName}
                  placeholder="First name"
                  icon={<User className="h-4 w-4" />}
                  onChange={(value) =>
                    updateField("firstName", value)
                  }
                />

                <ProfileInput
                  label="Last Name"
                  value={form.lastName}
                  placeholder="Last name"
                  icon={<User className="h-4 w-4" />}
                  onChange={(value) =>
                    updateField("lastName", value)
                  }
                />

                <ProfileInput
                  label="Email Address"
                  value={form.email}
                  placeholder="Email address"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  onChange={(value) =>
                    updateField("email", value)
                  }
                  disabled
                />

                <ProfileInput
                  label="Phone Number"
                  value={form.phone}
                  placeholder="+234 800 000 0000"
                  type="tel"
                  icon={<Phone className="h-4 w-4" />}
                  onChange={(value) =>
                    updateField("phone", value)
                  }
                />

              </div>

              {/* Email information */}

              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.07] dark:bg-white/[0.035]">

                <div className="flex gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                    <Mail className="h-4 w-4 !text-[#087ea4] dark:!text-[#67e8f9]" />
                  </div>

                  <div>

                    <p className="text-xs font-black !text-[#233b47] dark:!text-[#edf7fa]">
                      Email address
                    </p>

                    <p className="mt-1 text-[11px] leading-5 !text-[#5c707b] dark:!text-[#b8cbd4]">
                      Your email is used for account access and order
                      notifications. Email changes should be handled through
                      the account security flow.
                    </p>

                  </div>

                </div>

              </div>

              {/* Actions */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

                <Link
                  href="/account"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold !text-[#526774] transition hover:border-cyan-300 hover:!text-[#087ea4] dark:border-white/10 dark:bg-white/[0.03] dark:!text-[#d2e0e7] dark:hover:!text-[#67e8f9]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Link>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#05627F] via-[#087EA4] to-[#0b8fb7] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-900/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-900/25 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                      Save Changes
                    </>
                  )}

                </button>

              </div>

            </div>

          </section>

          {/* ===================================================
              SIDE PANEL
          =================================================== */}

          <aside className="space-y-4">

            {/* Security */}

            <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1119]/95">

              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-400/[0.07] blur-[60px]" />

              <div className="relative">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                    <ShieldCheck className="h-5 w-5 !text-emerald-600 dark:!text-emerald-400" />
                  </div>

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-wider !text-[#687b85] dark:!text-[#a9bdc7]">
                      Security
                    </p>

                    <h3 className="mt-0.5 text-sm font-black !text-[#172c36] dark:!text-[#f4fafc]">
                      Account Protected
                    </h3>

                  </div>

                </div>

                <p className="mt-4 text-xs leading-6 !text-[#5c707b] dark:!text-[#b8cbd4]">
                  Your authentication session is protected using secure
                  HttpOnly cookies.
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/[0.07] px-3 py-2.5">

                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />

                  <span className="text-[11px] font-bold !text-emerald-700 dark:!text-emerald-300">
                    Secure session active
                  </span>

                </div>

              </div>

            </div>

            {/* Address */}

            <AccountSideLink
              href="/account/addresses"
              icon={<MapPin className="h-5 w-5" />}
              iconClass="bg-cyan-500/10 !text-[#087ea4] dark:!text-[#67e8f9]"
              eyebrow="Delivery"
              title="Manage Addresses"
              description="Add and manage your saved delivery addresses."
            />

            {/* Orders */}

            <AccountSideLink
              href="/orders"
              icon={<Sparkles className="h-5 w-5" />}
              iconClass="bg-blue-500/10 !text-blue-600 dark:!text-blue-400"
              eyebrow="Shopping"
              title="My Orders"
              description="View your previous purchases and order status."
            />

            {/* Store */}

            <Link
              href="/products"
              className="group relative block overflow-hidden rounded-[1.5rem] border border-cyan-400/15 bg-gradient-to-br from-[#063f52] via-[#075a73] to-[#087ea4] p-5 shadow-[0_18px_55px_rgba(8,126,164,0.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_65px_rgba(8,126,164,0.22)]"
            >

              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-300/10 blur-[50px]" />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Sparkles className="h-5 w-5 text-cyan-100" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-cyan-100 transition-transform group-hover:translate-x-1" />

                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                  G by T Store
                </p>

                <h3 className="mt-1 text-base font-black text-white">
                  Continue Shopping
                </h3>

                <p className="mt-2 text-xs leading-5 text-cyan-100/85">
                  Discover more products and find something worth taking home.
                </p>

              </div>

            </Link>

          </aside>

        </div>

        {/* =====================================================
            BOTTOM NAV
        ===================================================== */}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">

          <BottomNavLink
            href="/account"
            icon={<UserRound className="h-4 w-4" />}
            eyebrow="Account"
            title="Account Dashboard"
          />

          <BottomNavLink
            href="/products"
            icon={<Sparkles className="h-4 w-4" />}
            eyebrow="Store"
            title="Continue Shopping"
          />

        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="mt-10 flex items-center justify-center gap-2 pb-4 text-xs !text-[#70838e] dark:!text-[#9db1bb]">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />

          <span>
            Secure G by T account experience
          </span>

        </footer>

      </div>

    </main>
  );
}

/* ===============================================================
   PROFILE INPUT
=============================================================== */

function ProfileInput({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  icon,
  disabled = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] !text-[#60747f] dark:!text-[#a9bdc7]">
        {label}
      </label>

      <div className="relative">

        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 !text-[#82959f] dark:!text-[#9fb4be]">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border py-3.5 text-sm font-semibold outline-none transition placeholder:!text-[#91a2aa] focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:placeholder:!text-[#718792] ${
            icon ? "pl-10 pr-4" : "px-4"
          } ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-100/80 !text-[#657983] dark:border-white/[0.07] dark:bg-white/[0.025] dark:!text-[#8da2ac]"
              : "border-slate-200 bg-slate-50/80 !text-[#10232d] hover:border-slate-300 dark:border-white/10 dark:bg-[#101923] dark:!text-[#f3f9fb] dark:hover:border-white/15"
          }`}
        />

      </div>

    </div>
  );
}

/* ===============================================================
   ACCOUNT SIDE LINK
=============================================================== */

function AccountSideLink({
  href,
  icon,
  iconClass,
  eyebrow,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/60 hover:shadow-[0_20px_60px_rgba(8,126,164,0.10)] dark:border-white/[0.08] dark:bg-[#0b1119]/95"
    >

      <div className="relative">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">

            <p className="text-[10px] font-black uppercase tracking-wider !text-[#687b85] dark:!text-[#a9bdc7]">
              {eyebrow}
            </p>

            <h3 className="mt-0.5 text-sm font-black !text-[#172c36] dark:!text-[#f4fafc]">
              {title}
            </h3>

          </div>

          <ChevronRight className="h-4 w-4 shrink-0 !text-[#8a9ca5] transition group-hover:translate-x-1 group-hover:!text-[#087ea4] dark:!text-[#9db1bb] dark:group-hover:!text-[#67e8f9]" />

        </div>

        <p className="mt-4 text-xs leading-6 !text-[#5c707b] dark:!text-[#b8cbd4]">
          {description}
        </p>

      </div>

    </Link>
  );
}

/* ===============================================================
   BOTTOM NAV
=============================================================== */

function BottomNavLink({
  href,
  icon,
  eyebrow,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/75 p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/60 dark:border-white/[0.08] dark:bg-white/[0.025]"
    >

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 !text-[#087ea4] dark:!text-[#67e8f9]">
          {icon}
        </div>

        <div>

          <p className="text-[10px] font-black uppercase tracking-wider !text-[#71838d] dark:!text-[#9fb3bd]">
            {eyebrow}
          </p>

          <p className="text-sm font-black !text-[#263e49] dark:!text-[#e5f0f4]">
            {title}
          </p>

        </div>

      </div>

      <ArrowRight className="h-4 w-4 !text-[#8799a2] transition group-hover:translate-x-1 group-hover:!text-[#087ea4] dark:!text-[#9db1bb] dark:group-hover:!text-[#67e8f9]" />

    </Link>
  );
}

/* ===============================================================
   LOADING
=============================================================== */

function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#f7fafc] dark:bg-[#05090e]">

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="mb-8 h-5 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />

        <div className="mb-9">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
          <div className="mt-3 h-12 w-56 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="mb-7 h-40 animate-pulse rounded-[1.75rem] bg-slate-200/70 dark:bg-white/[0.06]" />

        <div className="grid gap-7 lg:grid-cols-[1fr_380px]">

          <div className="h-[600px] animate-pulse rounded-[1.75rem] bg-slate-200/70 dark:bg-white/[0.06]" />

          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-[1.5rem] bg-slate-200/70 dark:bg-white/[0.06]" />
            <div className="h-36 animate-pulse rounded-[1.5rem] bg-slate-200/70 dark:bg-white/[0.06]" />
            <div className="h-36 animate-pulse rounded-[1.5rem] bg-slate-200/70 dark:bg-white/[0.06]" />
            <div className="h-40 animate-pulse rounded-[1.5rem] bg-slate-200/70 dark:bg-white/[0.06]" />
          </div>

        </div>

      </div>

    </main>
  );
}
