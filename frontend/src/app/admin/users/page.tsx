
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

import {
  getAdminUsers,
  type AdminUser,
  type AdminUserRole,
} from "@/lib/api/admin-users";

type FilterKey =
  | "all"
  | "customers"
  | "staff"
  | "active"
  | "inactive"
  | "verified"
  | "unverified";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<FilterKey>("all");

  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function loadUsers(
    requestedPage = page,
    filter: FilterKey = activeFilter
  ) {
    try {
      setLoading(true);
      setError(null);

      const params: {
        search?: string;
        role?: AdminUserRole;
        status?: "active" | "inactive";
        verified?: "true" | "false";
        ordering?: string;
        page?: number;
      } = {
        search: search.trim() || undefined,
        ordering: "-date_joined",
        page: requestedPage,
      };

      if (filter === "customers") {
        params.role = "CUSTOMER";
      }

      if (filter === "staff") {
        params.role = "STAFF";
      }

      if (filter === "active") {
        params.status = "active";
      }

      if (filter === "inactive") {
        params.status = "inactive";
      }

      if (filter === "verified") {
        params.verified = "true";
      }

      if (filter === "unverified") {
        params.verified = "false";
      }

      const response = await getAdminUsers(params);

      setUsers(response.results);
      setTotalUsers(response.count);
      setHasNext(Boolean(response.next));
      setHasPrevious(Boolean(response.previous));
      setPage(requestedPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(1, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(filter: FilterKey) {
    setActiveFilter(filter);
    setPage(1);
    loadUsers(1, filter);
  }

  function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPage(1);
    loadUsers(1, activeFilter);
  }

  function handlePreviousPage() {
    if (!hasPrevious || loading) return;

    const previousPage = Math.max(1, page - 1);
    loadUsers(previousPage, activeFilter);
  }

  function handleNextPage() {
    if (!hasNext || loading) return;

    loadUsers(page + 1, activeFilter);
  }

  const pageSize = 20;
  const firstResult =
    totalUsers === 0 ? 0 : (page - 1) * pageSize + 1;

  const lastResult = Math.min(
    page * pageSize,
    totalUsers
  );

  return (
    <main className="min-h-screen bg-[#05090e] text-white">
      <div className="page-container py-8 sm:py-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-opacity hover:opacity-80"
          >
            <ArrowLeft size={16} />
            Back to Admin Dashboard
          </Link>
        </div>

        <header className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_25px_rgba(57,213,242,0.06)]">
              <Users size={24} />
            </div>

            <div>
              <p className="text-sm font-medium text-cyan-300">
                G-BYT Administration
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
                User Management
              </h1>

              <p className="mt-2 text-sm text-white/45">
                Manage customers and staff accounts.
              </p>
              <Link
                href="/admin/users/create-staff"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-[#031017] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
                >
                <UserPlus size={16} />
                Create Staff
              </Link>
            </div>
          </div>
        </header>

        {/* Search + Filters */}
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterButton
              active={activeFilter === "all"}
              onClick={() => handleFilterChange("all")}
              icon={<Users size={15} />}
              label="All Users"
            />

            <FilterButton
              active={activeFilter === "customers"}
              onClick={() =>
                handleFilterChange("customers")
              }
              icon={<UserCheck size={15} />}
              label="Customers"
            />

            <FilterButton
              active={activeFilter === "staff"}
              onClick={() => handleFilterChange("staff")}
              icon={<UserCog size={15} />}
              label="Staff"
            />

            <FilterButton
              active={activeFilter === "active"}
              onClick={() => handleFilterChange("active")}
              icon={<UserCheck size={15} />}
              label="Active"
            />

            <FilterButton
              active={activeFilter === "inactive"}
              onClick={() =>
                handleFilterChange("inactive")
              }
              icon={<UserX size={15} />}
              label="Inactive"
            />

            <FilterButton
              active={activeFilter === "verified"}
              onClick={() =>
                handleFilterChange("verified")
              }
              icon={<BadgeCheck size={15} />}
              label="Verified"
            />

            <FilterButton
              active={activeFilter === "unverified"}
              onClick={() =>
                handleFilterChange("unverified")
              }
              icon={<BadgeCheck size={15} />}
              label="Unverified"
            />
          </div>
        </section>

        {/* Results */}
        <section className="mt-6">
          {loading && (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center text-sm text-white/50">
              Loading users...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
              <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Users
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    {totalUsers === 0
                      ? "No results"
                      : `Showing ${firstResult}–${lastResult} of ${totalUsers}`}
                  </p>
                </div>

                <div className="text-xs text-white/30">
                  Page {page}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-white">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/35">
                      <th className="px-5 py-4 font-medium">
                        User
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Role
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Verified
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Joined
                      </th>

                      <th className="px-5 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => {
                          window.location.href = `/admin/users/${user.id}`;
                        }}
                        className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.04]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {user.full_name ||
                              "Unnamed User"}
                          </div>

                          <div className="mt-1 text-sm text-white/40">
                            {user.email}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                              user.role === "STAFF"
                                ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
                                : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                            }`}
                          >
                            {user.role === "STAFF"
                              ? "Staff"
                              : "Customer"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                              user.is_active
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : "border-red-400/20 bg-red-400/10 text-red-300"
                            }`}
                          >
                            {user.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              user.is_email_verified
                                ? "text-emerald-300"
                                : "text-amber-300"
                            }
                          >
                            {user.is_email_verified
                              ? "Verified"
                              : "Unverified"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-white/40">
                          {new Date(
                            user.date_joined
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <ChevronRight
                            size={17}
                            className="text-white/25"
                          />
                        </td>
                      </tr>
                    ))}

                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-12 text-center text-sm text-white/35"
                        >
                          No users found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/35">
                  {totalUsers === 0
                    ? "No users to display"
                    : `Page ${page} of ${Math.ceil(
                        totalUsers / pageSize
                      )}`}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={!hasPrevious || loading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={!hasNext || loading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3.5 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
        active
          ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(57,213,242,0.05)]"
          : "border-white/[0.08] bg-white/[0.025] text-white/45 hover:border-white/15 hover:bg-white/[0.05] hover:text-white/75"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
