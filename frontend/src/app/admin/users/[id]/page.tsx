
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  Mail,
  Phone,
  Save,
  Shield,
  UserRound,
  UserX,
} from "lucide-react";

import {
  getAdminUser,
  updateAdminUser,
  updateCustomerProfile,
  updateStaffProfile,
  type AdminUser,
} from "@/lib/api/admin-users";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = Number(params.id);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [staffPhone, setStaffPhone] = useState("");

  useEffect(() => {
    if (!Number.isInteger(userId)) {
      setError("Invalid user ID.");
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadUser() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAdminUser(userId);

        if (!mounted) return;

        setUser(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setIsActive(data.is_active);
        setIsVerified(data.is_email_verified);

        if (data.customer_profile) {
          setPhoneNumber(data.customer_profile.phone_number || "");
          setDateOfBirth(data.customer_profile.date_of_birth || "");
        }

        if (data.staff_profile) {
          setJobTitle(data.staff_profile.job_title || "");
          setEmployeeId(data.staff_profile.employee_id || "");
          setStaffPhone(data.staff_profile.phone_number || "");
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this user."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [userId]);

  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedUser = await updateAdminUser(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_active: isActive,
        is_email_verified: isVerified,
      });

      let updatedCustomerProfile = user.customer_profile;
      let updatedStaffProfile = user.staff_profile;

      if (user.role === "CUSTOMER" && user.customer_profile) {
        updatedCustomerProfile = await updateCustomerProfile(
          user.id,
          {
            phone_number: phoneNumber.trim(),
            date_of_birth: dateOfBirth || null,
          }
        );
      }

      if (user.role === "STAFF" && user.staff_profile) {
        updatedStaffProfile = await updateStaffProfile(
          user.id,
          {
            job_title: jobTitle.trim(),
            employee_id: employeeId.trim() || null,
            phone_number: staffPhone.trim(),
          }
        );
      }

      setUser({
        ...updatedUser,
        customer_profile: updatedCustomerProfile,
        staff_profile: updatedStaffProfile,
      });

      setSuccess("User information updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save user changes."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="animate-pulse rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="h-7 w-56 rounded-lg bg-white/10" />
          <div className="mt-4 h-4 w-80 rounded bg-white/10" />
          <div className="mt-8 h-48 rounded-2xl bg-white/[0.04]" />
        </div>
      </AdminShell>
    );
  }

  if (error && !user) {
    return (
      <AdminShell>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <UserX className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="mt-4 text-xl font-semibold text-white">
            Unable to load user
          </h1>
          <p className="mt-2 text-sm text-white/60">{error}</p>

          <Link
            href="/admin/users"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            <ArrowLeft size={16} />
            Back to Users
          </Link>
        </div>
      </AdminShell>
    );
  }

  if (!user) return null;

  const isSuperAdmin = user.is_superuser;
  const canDeactivate = !isSuperAdmin;

  return (
    <AdminShell>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary-glow)] transition-opacity hover:opacity-80"
        >
          <ArrowLeft size={16} />
          Back to User Management
        </Link>
      </div>

      <header className="mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(57,213,242,0.08)]">
              <UserRound size={26} />
            </div>

            <div>
              <p className="text-sm font-medium text-cyan-300">
                G-BYT Administration
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {user.full_name || "Unnamed User"}
              </h1>

              <p className="mt-1 text-sm text-white/50">
                User ID #{user.id}
              </p>
            </div>
          </div>

          <StatusBadge active={user.is_active} />
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="admin-card">
            <SectionHeader
              icon={<UserRound size={19} />}
              title="Account Information"
              description="Basic information associated with this account."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="First Name"
                value={firstName}
                onChange={setFirstName}
              />

              <Field
                label="Last Name"
                value={lastName}
                onChange={setLastName}
              />

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Email Address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white/60">
                  <Mail size={17} />
                  <span className="text-sm">{user.email}</span>
                </div>

                <p className="mt-2 text-xs text-white/35">
                  Email addresses cannot be changed from this screen.
                </p>
              </div>
            </div>
          </section>

          {user.role === "CUSTOMER" && user.customer_profile && (
            <section className="admin-card">
              <SectionHeader
                icon={<Phone size={19} />}
                title="Customer Profile"
                description="Customer-specific profile information."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) =>
                      setDateOfBirth(event.target.value)
                    }
                    className="admin-input"
                  />
                </div>
              </div>
            </section>
          )}

          {user.role === "STAFF" && user.staff_profile && (
            <section className="admin-card">
              <SectionHeader
                icon={<Shield size={19} />}
                title="Staff Profile"
                description="Internal staff profile information."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Job Title"
                  value={jobTitle}
                  onChange={setJobTitle}
                />

                <Field
                  label="Employee ID"
                  value={employeeId}
                  onChange={setEmployeeId}
                />

                <Field
                  label="Phone Number"
                  value={staffPhone}
                  onChange={setStaffPhone}
                />
              </div>
            </section>
          )}

          <section className="admin-card">
            <SectionHeader
              icon={<BadgeCheck size={19} />}
              title="Account Controls"
              description="Manage the account's current access state."
            />

            <div className="space-y-4">
              <ToggleRow
                title="Account Active"
                description={
                  isActive
                    ? "This user can currently sign in."
                    : "This user cannot currently sign in."
                }
                checked={isActive}
                disabled={!canDeactivate}
                onChange={setIsActive}
              />

              <ToggleRow
                title="Email Verified"
                description={
                  isVerified
                    ? "The email address is marked as verified."
                    : "The email address is not yet verified."
                }
                checked={isVerified}
                onChange={setIsVerified}
              />

              {isSuperAdmin && (
                <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">
                  <div className="flex gap-3">
                    <Shield
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-300"
                    />

                    <div>
                      <p className="text-sm font-medium text-amber-200">
                        Super administrator account
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-200/60">
                        Super administrator accounts cannot be
                        deactivated from this interface.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(7,134,173,0.18)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="admin-card">
            <SectionHeader
              icon={<Shield size={19} />}
              title="Account Summary"
            />

            <div className="space-y-4">
              <InfoRow label="Role">
                <RoleBadge role={user.role} />
              </InfoRow>

              <InfoRow label="Status">
                <StatusBadge active={user.is_active} />
              </InfoRow>

              <InfoRow label="Verification">
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
              </InfoRow>

              <InfoRow label="Staff Access">
                <span className="text-white/70">
                  {user.is_staff ? "Enabled" : "Disabled"}
                </span>
              </InfoRow>

              <InfoRow label="Super Admin">
                <span className="text-white/70">
                  {user.is_superuser ? "Yes" : "No"}
                </span>
              </InfoRow>
            </div>
          </section>

          <section className="admin-card">
            <SectionHeader
              icon={<CalendarDays size={19} />}
              title="Account Dates"
            />

            <div className="space-y-4">
              <InfoRow label="Joined">
                <span className="text-white/70">
                  {formatDate(user.date_joined)}
                </span>
              </InfoRow>

              <InfoRow label="Last Updated">
                <span className="text-white/70">
                  {formatDate(user.updated_at)}
                </span>
              </InfoRow>
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#05090e] text-white">
      <div className="page-container py-8 sm:py-10">
        {children}
      </div>

      <style jsx global>{`
        .admin-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.055),
              rgba(255, 255, 255, 0.018)
            );
          box-shadow:
            0 18px 60px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(18px);
          padding: 1.5rem;
        }

        .admin-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
          color: white;
          padding: 0.75rem 1rem;
          outline: none;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .admin-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .admin-input:focus {
          border-color: rgba(57, 213, 242, 0.5);
          box-shadow: 0 0 0 3px rgba(57, 213, 242, 0.08);
          background: rgba(0, 0, 0, 0.28);
        }

        .admin-input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.55;
        }
      `}</style>
    </main>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-white">{title}</h2>

        {description && (
          <p className="mt-1 text-xs leading-5 text-white/40">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/70">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-input"
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-black/15 p-4">
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/40">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
          checked
            ? "border-cyan-400/40 bg-cyan-400/20"
            : "border-white/10 bg-white/5"
        } ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-pointer"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full transition ${
            checked
              ? "left-6 bg-cyan-300 shadow-[0_0_12px_rgba(57,213,242,0.45)]"
              : "left-1 bg-white/40"
          }`}
        />
      </button>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-white/40">{label}</span>
      <div className="text-right text-sm">{children}</div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        active
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-red-400/20 bg-red-400/10 text-red-300"
      }`}
    >
      {active ? (
        <CheckCircle2 size={13} />
      ) : (
        <Ban size={13} />
      )}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RoleBadge({
  role,
}: {
  role: AdminUser["role"];
}) {
  const isStaff = role === "STAFF";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        isStaff
          ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
      }`}
    >
      {isStaff ? "Staff" : "Customer"}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
