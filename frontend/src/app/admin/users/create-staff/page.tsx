
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  UserPlus,
} from "lucide-react";
import { createStaff } from "@/lib/api/admin-users";

export default function CreateStaffPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    job_title: "",
    phone_number: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");
    setEmployeeId("");

    try {
      const createdStaff = await createStaff({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        job_title: form.job_title.trim(),
        phone_number: form.phone_number.trim(),
      });

      const generatedEmployeeId =
        createdStaff.staff_profile?.employee_id ?? "";

      setEmployeeId(generatedEmployeeId);
      setSuccess(
        "Staff account created successfully."
      );

      setForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        job_title: "",
        phone_number: "",
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to create the staff account."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function copyEmployeeId() {
    if (!employeeId) return;

    try {
      await navigator.clipboard.writeText(
        employeeId
      );
    } catch {
      // Clipboard access may be unavailable in
      // some browser contexts.
    }
  }

  return (
    <main className="min-h-screen bg-[#05090e] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin/users"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
            aria-label="Back to users"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <UserPlus
                size={18}
                className="text-cyan-400"
              />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                User Management
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Create Staff Account
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Create an internal staff account with
              controlled administrative access.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-7"
          >
            {/* Account */}
            <section>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white">
                  Account Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  These details are used to create the
                  staff login.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField("email", value)
                  }
                  placeholder="staff@gbyt.com"
                  required
                />

                <Field
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(value) =>
                    updateField(
                      "password",
                      value
                    )
                  }
                  placeholder="Enter a secure password"
                  required
                />
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            {/* Personal */}
            <section>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white">
                  Personal Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Basic information associated with
                  the staff member.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="First Name"
                  value={form.first_name}
                  onChange={(value) =>
                    updateField(
                      "first_name",
                      value
                    )
                  }
                  placeholder="First name"
                />

                <Field
                  label="Last Name"
                  value={form.last_name}
                  onChange={(value) =>
                    updateField(
                      "last_name",
                      value
                    )
                  }
                  placeholder="Last name"
                />

                <Field
                  label="Phone Number"
                  value={form.phone_number}
                  onChange={(value) =>
                    updateField(
                      "phone_number",
                      value
                    )
                  }
                  placeholder="+234..."
                />
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            {/* Employment */}
            <section>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white">
                  Staff Profile
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Internal employment information.
                  Employee ID is generated automatically.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Job Title"
                  value={form.job_title}
                  onChange={(value) =>
                    updateField(
                      "job_title",
                      value
                    )
                  }
                  placeholder="e.g. Operations Manager"
                />

                <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
                  <div className="text-sm font-medium text-gray-300">
                    Employee ID
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="font-mono text-sm text-cyan-300">
                      Automatically generated
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    A unique GBT staff ID will be
                    assigned when the account is created.
                  </p>
                </div>
              </div>
            </section>

            {/* Messages */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {success}
                    </p>

                    {employeeId && (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.15em] text-emerald-400/60">
                          Generated Employee ID
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-lg border border-emerald-400/20 bg-black/20 px-3 py-2 font-mono text-sm font-semibold text-emerald-300">
                            {employeeId}
                          </span>

                          <button
                            type="button"
                            onClick={
                              copyEmployeeId
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/20"
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-emerald-400/70">
                      The account is now available
                      in the staff directory.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/users"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 text-sm font-semibold text-[#031017] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserPlus size={17} />

                {saving
                  ? "Creating Staff..."
                  : "Create Staff Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-300">
        {label}

        {required && (
          <span className="ml-1 text-cyan-400">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/50 focus:bg-cyan-400/[0.03] focus:ring-2 focus:ring-cyan-400/10"
      />
    </label>
  );
}
