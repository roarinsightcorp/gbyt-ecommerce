"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Check,
  Edit3,
  Home,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useAuthContext } from "@/providers/auth-provider";

import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "@/lib/api/addresses";

import type {
  Address,
  AddressPayload,
} from "@/types/address";

import ThemeToggle from "@/components/ui/theme-toggle";

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

const emptyForm: AddressPayload = {
  address_type: "SHIPPING",

  first_name: "",
  last_name: "",

  company: "",

  address_line_1: "",
  address_line_2: "",

  city: "",
  state: "",
  postal_code: "",

  country: "Nigeria",

  phone: "",

  is_default: false,

  is_default_shipping: false,
  is_default_billing: false,
};

/* -------------------------------------------------------------------------- */
/*                                  Page                                      */
/* -------------------------------------------------------------------------- */

export default function AddressesPage() {
  const router = useRouter();

  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
  } = useAuthContext();

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);

  const [form, setForm] =
    useState<AddressPayload>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /*                           Authentication                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      router.replace(
        "/login?next=/account/addresses"
      );
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                             Load addresses                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    async function loadAddresses() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAddresses();

        setAddresses(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "[addresses] Load error:",
          err
        );

        setError(
          "Unable to load your saved addresses."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAddresses();
  }, [isAuthenticated]);

  /* ------------------------------------------------------------------------ */
  /*                              Create form                                  */
  /* ------------------------------------------------------------------------ */

  function openCreateForm() {
    setEditingAddress(null);

    setForm({
      ...emptyForm,

      address_type: "SHIPPING",

      first_name:
        user?.first_name ?? "",

      last_name:
        user?.last_name ?? "",

      phone:
        user?.phone_number ?? "",

      is_default_shipping:
        addresses.length === 0,

      is_default:
        addresses.length === 0,
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /*                               Edit form                                   */
  /* ------------------------------------------------------------------------ */

  function openEditForm(
    address: Address
  ) {
    setEditingAddress(address);

    const isShipping =
      address.address_type ===
      "SHIPPING";

    const isBilling =
      address.address_type ===
      "BILLING";

    setForm({
      address_type:
        address.address_type,

      first_name:
        address.first_name,

      last_name:
        address.last_name,

      company:
        address.company ?? "",

      address_line_1:
        address.address_line_1,

      address_line_2:
        address.address_line_2 ?? "",

      city:
        address.city,

      state:
        address.state,

      postal_code:
        address.postal_code ?? "",

      country:
        address.country,

      phone:
        address.phone ??
        address.phone_number ??
        "",

      is_default:
        address.is_default,

      is_default_shipping:
        isShipping &&
        Boolean(
          address.is_default_shipping ??
            address.is_default
        ),

      is_default_billing:
        isBilling &&
        Boolean(
          address.is_default_billing ??
            address.is_default
        ),
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /*                              Close form                                   */
  /* ------------------------------------------------------------------------ */

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingAddress(null);
    setForm(emptyForm);
  }

  /* ------------------------------------------------------------------------ */
  /*                              Form update                                  */
  /* ------------------------------------------------------------------------ */

  function updateField(
    field: keyof AddressPayload,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ------------------------------------------------------------------------ */
  /*                              Submit form                                  */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Always make this a SHIPPING address on this page.
       *
       * The checkout service requires a SHIPPING address.
       */
      const payload: AddressPayload = {
        ...form,

        address_type:
          form.address_type ??
          "SHIPPING",

        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        address_line_1:
          form.address_line_1.trim(),

        address_line_2:
          form.address_line_2?.trim() ?? "",

        city:
          form.city.trim(),

        state:
          form.state.trim(),

        country:
          form.country.trim(),

        postal_code:
          form.postal_code?.trim() ?? "",

        phone:
          form.phone?.trim() ?? "",

        /*
         * Backend uses one `is_default` field.
         */
        is_default:
          Boolean(
            form.is_default_shipping
          ),
      };

      let saved: Address;

      if (editingAddress) {
        saved =
          await updateAddress(
            editingAddress.id,
            payload
          );

        setAddresses(
          (current) =>
            current.map(
              (address) =>
                address.id ===
                saved.id
                  ? saved
                  : address
            )
        );

        setSuccess(
          "Your address has been updated successfully."
        );
      } else {
        saved =
          await createAddress(
            payload
          );

        setAddresses(
          (current) => [
            ...current,
            saved,
          ]
        );

        setSuccess(
          "Your address has been saved successfully."
        );
      }

      setShowForm(false);
      setEditingAddress(null);
      setForm(emptyForm);
    } catch (err) {
      console.error(
        "[addresses] Save error:",
        err
      );

      /*
       * Try to expose Django validation errors
       * instead of only showing a generic 400.
       */
      const apiError =
        err as {
          message?: string;
          errorData?: unknown;
          data?: unknown;
        };

      const backendError =
        apiError.errorData ??
        apiError.data;

      if (
        backendError &&
        typeof backendError ===
          "object"
      ) {
        try {
          setError(
            Object.entries(
              backendError as Record<
                string,
                unknown
              >
            )
              .map(
                ([field, value]) =>
                  `${field}: ${
                    Array.isArray(value)
                      ? value.join(", ")
                      : String(value)
                  }`
              )
              .join(" • ")
          );
        } catch {
          setError(
            "We couldn't save this address. Please check your information and try again."
          );
        }
      } else {
        setError(
          apiError.message ||
            "We couldn't save this address. Please check your information and try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                               Delete                                      */
  /* ------------------------------------------------------------------------ */

  async function handleDelete(
    address: Address
  ) {
    const confirmed =
      window.confirm(
        `Delete the address for ${address.first_name} ${address.last_name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        address.id
      );

      setError("");
      setSuccess("");

      await deleteAddress(
        address.id
      );

      setAddresses(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              address.id
          )
      );

      setSuccess(
        "Address deleted successfully."
      );
    } catch (err) {
      console.error(
        "[addresses] Delete error:",
        err
      );

      setError(
        "Unable to delete this address."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                               Loading                                     */
  /* ------------------------------------------------------------------------ */

  if (
    authLoading ||
    (!isAuthenticated &&
      loading)
  ) {
    return (
      <main className="min-h-screen bg-[#f7fafc] px-6 py-20 dark:bg-[#05090e]">
        <div className="mx-auto max-w-6xl">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-white/70 dark:bg-white/5" />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="h-56 animate-pulse rounded-3xl bg-white/70 dark:bg-white/5" />

            <div className="h-56 animate-pulse rounded-3xl bg-white/70 dark:bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /*                                  UI                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#f7fafc]
        text-slate-900
        transition-colors
        duration-300
        dark:bg-[#05090e]
        dark:text-white
      "
    >
      {/* ------------------------------------------------------------------ */}
      {/* Ambient background                                                  */}
      {/* ------------------------------------------------------------------ */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#39D5F2]/10 blur-3xl" />

        <div className="absolute -right-32 top-60 h-96 w-96 rounded-full bg-[#0786AD]/10 blur-3xl" />

        <div className="absolute left-1/2 top-[45%] h-72 w-72 -translate-x-1/2 rounded-full bg-[#7C3AED]/5 blur-3xl dark:bg-[#7C3AED]/5" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/account"
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-medium
                text-slate-500
                transition
                hover:text-[#0786AD]
                dark:text-slate-400
                dark:hover:text-[#39D5F2]
              "
            >
              <ArrowLeft size={16} />

              Back to account
            </Link>

            <ThemeToggle />
          </div>

          <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[#0786AD]/15
                  bg-white/70
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-[#05647F]
                  shadow-sm
                  backdrop-blur-xl
                  dark:border-white/10
                  dark:bg-white/5
                  dark:text-[#39D5F2]
                "
              >
                <MapPin size={14} />

                Delivery addresses
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Your addresses
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Manage the addresses you use
                for deliveries and checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[#0786AD]
                px-5
                py-3
                text-sm
                font-bold
                text-white
                shadow-[0_12px_30px_rgba(7,134,173,0.25)]
                transition
                hover:-translate-y-0.5
                hover:bg-[#05647F]
              "
            >
              <Plus size={18} />

              Add address
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Alerts                                                            */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <div
            className="
              mb-6
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
              dark:border-red-500/20
              dark:bg-red-500/10
              dark:text-red-300
            "
          >
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span className="leading-6">
              {error}
            </span>
          </div>
        )}

        {success && (
          <div
            className="
              mb-6
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3
              text-sm
              text-emerald-700
              dark:border-emerald-500/20
              dark:bg-emerald-500/10
              dark:text-emerald-300
            "
          >
            <Check
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>
              {success}
            </span>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Address list                                                      */}
        {/* ---------------------------------------------------------------- */}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-64
                    animate-pulse
                    rounded-3xl
                    border
                    border-white/60
                    bg-white/70
                    dark:border-white/10
                    dark:bg-white/5
                  "
                />
              )
            )}
          </div>
        ) : addresses.length === 0 ? (
          <div
            className="
              rounded-[2rem]
              border
              border-white/70
              bg-white/75
              p-10
              text-center
              shadow-[0_20px_70px_rgba(15,23,42,0.06)]
              backdrop-blur-2xl
              dark:border-white/10
              dark:bg-white/[0.04]
            "
          >
            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-[#E3F8FC]
                text-[#0786AD]
                dark:bg-[#0786AD]/10
                dark:text-[#39D5F2]
              "
            >
              <Home size={28} />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No saved addresses
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Add a delivery address so
              your next checkout is faster.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-[#0786AD]
                px-5
                py-3
                text-sm
                font-bold
                text-white
                transition
                hover:bg-[#05647F]
              "
            >
              <Plus size={17} />

              Add your first address
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {addresses.map(
              (address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  deleting={
                    deletingId ===
                    address.id
                  }
                  onEdit={() =>
                    openEditForm(
                      address
                    )
                  }
                  onDelete={() =>
                    handleDelete(
                      address
                    )
                  }
                />
              )
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Trust panel                                                       */}
        {/* ---------------------------------------------------------------- */}

        <div
          className="
            mt-8
            flex
            items-start
            gap-4
            rounded-3xl
            border
            border-[#0786AD]/10
            bg-white/60
            p-5
            backdrop-blur-xl
            dark:border-white/10
            dark:bg-white/[0.03]
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-[#E3F8FC]
              text-[#0786AD]
              dark:bg-[#0786AD]/10
              dark:text-[#39D5F2]
            "
          >
            <ShieldCheck size={21} />
          </div>

          <div>
            <h3 className="text-sm font-bold">
              Your information is protected
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Your saved addresses are
              associated with your
              authenticated G-BYT account
              and are used to process your
              orders securely.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Address modal                                                       */}
      {/* ------------------------------------------------------------------ */}

      {showForm && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            overflow-y-auto
            bg-slate-950/50
            px-4
            py-8
            backdrop-blur-md
          "
        >
          <div
            className="
              w-full
              max-w-2xl
              rounded-[2rem]
              border
              border-white/70
              bg-white/95
              p-6
              shadow-2xl
              dark:border-white/10
              dark:bg-[#0a1118]/95
              sm:p-8
            "
          >
            {/* Modal header */}

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div
                  className="
                    mb-2
                    inline-flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#E3F8FC]
                    text-[#0786AD]
                    dark:bg-[#0786AD]/10
                    dark:text-[#39D5F2]
                  "
                >
                  <MapPin size={19} />
                </div>

                <h2 className="text-xl font-black">
                  {editingAddress
                    ? "Edit address"
                    : "Add a new address"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter your delivery
                  details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="
                  rounded-xl
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:opacity-50
                  dark:hover:bg-white/10
                  dark:hover:text-white
                "
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="First name"
                  value={
                    form.first_name
                  }
                  required
                  onChange={(value) =>
                    updateField(
                      "first_name",
                      value
                    )
                  }
                />

                <Field
                  label="Last name"
                  value={
                    form.last_name
                  }
                  required
                  onChange={(value) =>
                    updateField(
                      "last_name",
                      value
                    )
                  }
                />
              </div>

              <Field
                label="Company"
                value={
                  form.company ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "company",
                    value
                  )
                }
              />

              <Field
                label="Address line 1"
                value={
                  form.address_line_1
                }
                required
                onChange={(value) =>
                  updateField(
                    "address_line_1",
                    value
                  )
                }
              />

              <Field
                label="Address line 2"
                value={
                  form.address_line_2 ??
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "address_line_2",
                    value
                  )
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="City"
                  value={form.city}
                  required
                  onChange={(value) =>
                    updateField(
                      "city",
                      value
                    )
                  }
                />

                <Field
                  label="State"
                  value={form.state}
                  required
                  onChange={(value) =>
                    updateField(
                      "state",
                      value
                    )
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Postal code"
                  value={
                    form.postal_code ??
                    ""
                  }
                  onChange={(value) =>
                    updateField(
                      "postal_code",
                      value
                    )
                  }
                />

                <Field
                  label="Country"
                  value={
                    form.country
                  }
                  required
                  onChange={(value) =>
                    updateField(
                      "country",
                      value
                    )
                  }
                />
              </div>

              <Field
                label="Phone"
                value={
                  form.phone ?? ""
                }
                required
                onChange={(value) =>
                  updateField(
                    "phone",
                    value
                  )
                }
              />

              {/* Default address */}

              <Toggle
                checked={
                  Boolean(
                    form.is_default_shipping
                  )
                }
                onChange={(value) => {
                  updateField(
                    "is_default_shipping",
                    value
                  );

                  updateField(
                    "is_default",
                    value
                  );
                }}
                title="Default shipping address"
                description="Use this address automatically for deliveries and checkout."
              />

              {/* Form actions */}

              <div
                className="
                  flex
                  flex-col-reverse
                  gap-3
                  border-t
                  border-slate-200
                  pt-5
                  dark:border-white/10
                  sm:flex-row
                  sm:justify-end
                "
              >
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                    dark:border-white/10
                    dark:text-slate-300
                    dark:hover:bg-white/5
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    rounded-xl
                    bg-[#0786AD]
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    shadow-[#0786AD]/20
                    transition
                    hover:bg-[#05647F]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving
                    ? "Saving..."
                    : editingAddress
                      ? "Update address"
                      : "Save address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* ========================================================================== */
/*                              Address Card                                  */
/* ========================================================================== */

function AddressCard({
  address,
  deleting,
  onEdit,
  onDelete,
}: {
  address: Address;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isShipping =
    address.address_type ===
    "SHIPPING";

  const isBilling =
    address.address_type ===
    "BILLING";

  const defaultShipping =
    address.is_default_shipping ??
    (isShipping &&
      address.is_default);

  const defaultBilling =
    address.is_default_billing ??
    (isBilling &&
      address.is_default);

  const phone =
    address.phone ??
    address.phone_number;

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[2rem]
        border
        border-white/70
        bg-white/80
        p-6
        shadow-[0_20px_70px_rgba(15,23,42,0.06)]
        backdrop-blur-2xl
        transition
        hover:-translate-y-0.5
        hover:shadow-[0_25px_80px_rgba(7,134,173,0.10)]
        dark:border-white/10
        dark:bg-white/[0.045]
      "
    >
      {/* Card glow */}

      <div
        className="
          absolute
          -right-10
          -top-10
          h-28
          w-28
          rounded-full
          bg-[#39D5F2]/10
          blur-2xl
        "
      />

      <div className="relative">
        {/* Card heading */}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-[#E3F8FC]
                text-[#0786AD]
                dark:bg-[#0786AD]/10
                dark:text-[#39D5F2]
              "
            >
              <Home size={20} />
            </div>

            <div>
              <h2 className="font-bold">
                {address.first_name}{" "}
                {address.last_name}
              </h2>

              {address.company && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {address.company}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="
                rounded-xl
                p-2
                text-slate-400
                transition
                hover:bg-[#E3F8FC]
                hover:text-[#0786AD]
                dark:hover:bg-white/10
                dark:hover:text-[#39D5F2]
              "
              aria-label="Edit address"
            >
              <Edit3 size={17} />
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="
                rounded-xl
                p-2
                text-slate-400
                transition
                hover:bg-red-50
                hover:text-red-500
                disabled:opacity-50
                dark:hover:bg-red-500/10
              "
              aria-label="Delete address"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {/* Address */}

        <div
          className="
            mt-5
            space-y-1.5
            text-sm
            leading-6
            text-slate-600
            dark:text-slate-300
          "
        >
          <p>
            {address.address_line_1}
          </p>

          {address.address_line_2 && (
            <p>
              {address.address_line_2}
            </p>
          )}

          <p>
            {address.city},{" "}
            {address.state}

            {address.postal_code
              ? ` ${address.postal_code}`
              : ""}
          </p>

          <p>
            {address.country}
          </p>

          {phone && (
            <p
              className="
                pt-1
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              {phone}
            </p>
          )}
        </div>

        {/* Badges */}

        <div className="mt-5 flex flex-wrap gap-2">
          {defaultShipping && (
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-[#E3F8FC]
                px-3
                py-1
                text-[11px]
                font-bold
                text-[#05647F]
                dark:bg-[#0786AD]/10
                dark:text-[#39D5F2]
              "
            >
              <Check size={12} />

              Default shipping
            </span>
          )}

          {defaultBilling && (
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-violet-50
                px-3
                py-1
                text-[11px]
                font-bold
                text-violet-600
                dark:bg-violet-500/10
                dark:text-violet-300
              "
            >
              <Check size={12} />

              Default billing
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*                                  Field                                     */
/* ========================================================================== */

function Field({
  label,
  value,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-xs
          font-bold
          uppercase
          tracking-[0.12em]
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}

        {required && (
          <span className="ml-1 text-[#0786AD]">
            *
          </span>
        )}
      </span>

      <input
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-3
          text-sm
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-[#0786AD]
          focus:ring-4
          focus:ring-[#0786AD]/10
          dark:border-white/10
          dark:bg-white/[0.04]
          dark:text-white
          dark:placeholder:text-slate-500
        "
      />
    </label>
  );
}

/* ========================================================================== */
/*                                  Toggle                                    */
/* ========================================================================== */

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className={`
        flex
        w-full
        items-start
        gap-3
        rounded-2xl
        border
        p-4
        text-left
        transition

        ${
          checked
            ? "border-[#0786AD]/30 bg-[#E3F8FC]/60 dark:border-[#0786AD]/30 dark:bg-[#0786AD]/10"
            : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]"
        }
      `}
    >
      <span
        className={`
          mt-0.5
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-md
          border
          transition

          ${
            checked
              ? "border-[#0786AD] bg-[#0786AD] text-white"
              : "border-slate-300 dark:border-slate-600"
          }
        `}
      >
        {checked && (
          <Check size={13} />
        )}
      </span>

      <span>
        <span className="block text-sm font-bold">
          {title}
        </span>

        <span
          className="
            mt-1
            block
            text-xs
            leading-5
            text-slate-500
            dark:text-slate-400
          "
        >
          {description}
        </span>
      </span>
    </button>
  );
}