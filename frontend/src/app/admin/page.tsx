"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import {
  getAdminAccess,
  getAdminUserSummary,
  type AdminAccess,
  type AdminUserSummary,
} from "@/lib/api/admin-users";

export default function AdminPage() {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [summary, setSummary] =
    useState<AdminUserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAdminDashboard() {
      try {
        setLoading(true);
        setError(null);

        const adminAccess = await getAdminAccess();

        if (!mounted) {
          return;
        }

        setAccess(adminAccess);

        if (
          adminAccess.is_admin &&
          adminAccess.is_super_admin
        ) {
          const adminSummary =
            await getAdminUserSummary();

          if (!mounted) {
            return;
          }

          setSummary(adminSummary);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        const status =
          typeof err === "object" &&
          err !== null &&
          "status" in err
            ? Number(
                (err as { status?: number }).status
              )
            : undefined;

        if (status === 401) {
          setError(
            "Your session has expired. Please sign in again."
          );
        } else if (status === 403) {
          setError(
            "You do not have permission to access the administration area."
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the admin dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAdminDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen page-container py-10">
        <div className="glass-card animate-pulse p-8">
          <div className="h-8 w-48 rounded-lg bg-black/5 dark:bg-white/10" />
          <div className="mt-4 h-4 w-72 rounded bg-black/5 dark:bg-white/10" />
        </div>
      </main>
    );
  }

  if (error || !access?.is_super_admin) {
    return (
      <main className="min-h-screen page-container py-10">
        <section className="glass-card mx-auto max-w-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <ShieldAlert size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            Administration access required
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            {error ||
              "This area is restricted to super administrators."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-container py-8 sm:py-10">
      <header className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm">
            <ShieldCheck size={24} />
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--primary)]">
              G-BYT Administration
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Manage users, staff, customers, orders and
              store operations.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Users"
          value={summary?.total_users ?? 0}
        />

        <SummaryCard
          label="Customers"
          value={summary?.customers ?? 0}
        />

        <SummaryCard
          label="Staff"
          value={summary?.staff ?? 0}
        />

        <SummaryCard
          label="Active Users"
          value={summary?.active_users ?? 0}
        />
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="glass-card group p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value.toLocaleString()}
      </p>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--primary-soft)]">
        <div className="h-full w-1/3 rounded-full bg-[var(--primary)] transition-all duration-500 group-hover:w-2/3" />
      </div>
    </article>
  );
}