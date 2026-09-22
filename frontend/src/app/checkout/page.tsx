"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Moon,
  Package,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
  User,
} from "lucide-react";

import { useAuthContext } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";

import { getAddresses, createAddress } from "@/lib/api/addresses";
import {
  createCheckoutOrder,
  initializePayment,
} from "@/lib/api/orders";

import type {
  Address,
  AddressPayload,
} from "@/types/address";

/* ================================================================
   TYPES
================================================================ */

type DeliveryMethod = "standard" | "express";

type AddressMode = "saved" | "new";

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryNotes: string;
}

const INITIAL_FORM: CheckoutForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
  deliveryNotes: "",
};

/*
 * The current Django checkout service calculates shipping_fee = 0.
 *
 * We therefore keep the delivery methods available in the UI, but do
 * NOT add a frontend-only fee to the payment total.
 *
 * Once the backend supports server-side delivery pricing, these prices
 * can be wired into the real order calculation.
 */
const DELIVERY_OPTIONS: Record<
  DeliveryMethod,
  {
    label: string;
    description: string;
  }
> = {
  standard: {
    label: "Standard Delivery",
    description: "Reliable delivery within 3–7 business days",
  },
  express: {
    label: "Express Delivery",
    description: "Priority delivery within 1–3 business days",
  },
};

/* ================================================================
   MAIN PAGE
================================================================ */

export default function CheckoutPage() {
  const router = useRouter();

  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
  } = useAuthContext();

  const {
    items,
    itemCount,
    subtotal,
    isLoading: cartLoading,
  } = useCart();

  const [form, setForm] =
    useState<CheckoutForm>(INITIAL_FORM);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] =
    useState(true);

  const [addressMode, setAddressMode] =
    useState<AddressMode>("saved");

  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("standard");

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [error, setError] = useState("");

  const [theme, setTheme] = useState<"light" | "dark">(
    "light"
  );

  /* ==============================================================
     AUTH GUARD
  ============================================================== */

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?next=/checkout");
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ]);

  /* ==============================================================
     THEME
  ============================================================== */

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem("gbyt-theme");

    const preferredTheme =
      savedTheme === "dark" ||
      savedTheme === "light"
        ? savedTheme
        : window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches
        ? "dark"
        : "light";

    setTheme(preferredTheme);

    document.documentElement.classList.toggle(
      "dark",
      preferredTheme === "dark"
    );
  }, []);

  function toggleTheme() {
    const nextTheme =
      theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );

    window.localStorage.setItem(
      "gbyt-theme",
      nextTheme
    );
  }

  /* ==============================================================
     PREFILL USER
  ============================================================== */

  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      ...current,
      email:
        current.email ||
        user.email ||
        "",
      firstName:
        current.firstName ||
        user.first_name ||
        "",
      lastName:
        current.lastName ||
        user.last_name ||
        "",
      phone:
        current.phone ||
        user.phone_number ||
        "",
    }));
  }, [user]);

  /* ==============================================================
     LOAD ADDRESSES
  ============================================================== */

  async function loadAddresses() {
    try {
      setAddressesLoading(true);
      setError("");

      const result = await getAddresses();

      setAddresses(result);

      const defaultShipping =
        result.find(
          (address) =>
            address.is_default_shipping
        ) || result[0];

      if (defaultShipping) {
        setSelectedAddressId(
          defaultShipping.id
        );
        setAddressMode("saved");

        setForm((current) => ({
          ...current,
          firstName:
            current.firstName ||
            defaultShipping.first_name,
          lastName:
            current.lastName ||
            defaultShipping.last_name,
          phone:
            current.phone ||
            defaultShipping.phone ||
            "",
          address:
            current.address ||
            defaultShipping.address_line_1,
          addressLine2:
            current.addressLine2 ||
            defaultShipping.address_line_2 ||
            "",
          city:
            current.city ||
            defaultShipping.city,
          state:
            current.state ||
            defaultShipping.state,
          postalCode:
            current.postalCode ||
            defaultShipping.postal_code ||
            "",
          country:
            current.country ||
            defaultShipping.country ||
            "Nigeria",
        }));
      } else {
        setAddressMode("new");
      }
    } catch (err) {
      console.error(
        "Failed to load addresses:",
        err
      );

      /*
       * A customer can still create a new address
       * even if loading saved addresses fails.
       */
      setAddresses([]);
      setAddressMode("new");
    } finally {
      setAddressesLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void loadAddresses();
    }
  }, [
    authLoading,
    isAuthenticated,
  ]);

  /* ==============================================================
     SELECT SAVED ADDRESS
  ============================================================== */

  function selectAddress(address: Address) {
    setSelectedAddressId(address.id);
    setAddressMode("saved");

    setForm((current) => ({
      ...current,
      firstName: address.first_name,
      lastName: address.last_name,
      phone: address.phone_number || "",
      address: address.address_line_1,
      addressLine2:
        address.address_line_2 || "",
      city: address.city,
      state: address.state,
      postalCode:
        address.postal_code || "",
      country:
        address.country || "Nigeria",
    }));

    setError("");
  }

  function switchToNewAddress() {
    setAddressMode("new");
    setSelectedAddressId(null);

    setForm((current) => ({
      ...current,
      address: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
    }));

    setError("");
  }

  /* ==============================================================
     PRICING
  ============================================================== */

  const subtotalAmount = Number(
    subtotal || 0
  );

  /*
   * Current backend shipping fee is 0.
   * Do not manufacture a different payment amount on the frontend.
   */
  const shippingAmount = 0;

  const totalAmount =
    subtotalAmount + shippingAmount;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(value);

  /* ==============================================================
     FORM HANDLING
  ============================================================== */

  function updateField(
    field: keyof CheckoutForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function validateForm() {
    const requiredFields: Array<
      [keyof CheckoutForm, string]
    > = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["email", "Email address"],
      ["phone", "Phone number"],
      ["address", "Delivery address"],
      ["city", "City"],
      ["state", "State"],
      ["country", "Country"],
    ];

    for (const [
      field,
      label,
    ] of requiredFields) {
      if (!form[field].trim()) {
        setError(
          `${label} is required.`
        );
        return false;
      }
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        form.email
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return false;
    }

    if (
      form.phone.trim().length < 7
    ) {
      setError(
        "Please enter a valid phone number."
      );
      return false;
    }

    if (
      addressMode === "saved" &&
      !selectedAddressId
    ) {
      setError(
        "Please select a delivery address."
      );
      return false;
    }

    return true;
  }

  /* ==============================================================
     CREATE NEW ADDRESS
  ============================================================== */

  async function createCheckoutAddress(): Promise<number> {
    const payload: AddressPayload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      address_line_1:
        form.address.trim(),
      address_line_2:
        form.addressLine2.trim() ||
        undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code:
        form.postalCode.trim() ||
        undefined,
      country:
        form.country.trim(),
      phone:
        form.phone.trim() ||
        undefined,
      is_default_shipping:
        addresses.length === 0,
    };

    const created =
      await createAddress(payload);

    setAddresses((current) => [
      ...current,
      created,
    ]);

    return created.id;
  }

  /* ==============================================================
     PLACE ORDER
  ============================================================== */

  async function handlePlaceOrder() {
    if (placingOrder) return;

    setError("");

    if (!validateForm()) {
      return;
    }

    setPlacingOrder(true);

    try {
      let shippingAddressId =
        selectedAddressId;

      /*
       * If the customer entered a new address,
       * persist it first so the Django checkout
       * service can use shipping_address_id.
       */
      if (
        addressMode === "new"
      ) {
        shippingAddressId =
          await createCheckoutAddress();
      }

      if (!shippingAddressId) {
        throw new Error(
          "A shipping address is required."
        );
      }

      /*
       * Keep delivery information in customer_note
       * until backend delivery pricing is implemented.
       *
       * This ensures we do not charge a frontend-only
       * shipping amount that Django does not know about.
       */
      const deliveryNote =
        `Delivery method: ${
          DELIVERY_OPTIONS[
            deliveryMethod
          ].label
        }.`;

      const combinedNote = [
        deliveryNote,
        form.deliveryNotes.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      /* ----------------------------------------------------------
         1. CREATE ORDER
      ---------------------------------------------------------- */

      const order =
        await createCheckoutOrder({
          shipping_address_id:
            shippingAddressId,
          customer_note:
            combinedNote || undefined,
        });

      /* ----------------------------------------------------------
         2. INITIALIZE PAYSTACK
      ---------------------------------------------------------- */

      const payment =
        await initializePayment(
          order.order_number
        );

      if (
        !payment.authorization_url
      ) {
        throw new Error(
          "Paystack did not return a payment authorization URL."
        );
      }

      /*
       * Store the order number temporarily so the
       * payment page/callback can recover context.
       */
      window.sessionStorage.setItem(
        "gbyt_pending_order",
        order.order_number
      );

      window.sessionStorage.setItem(
        "gbyt_pending_payment_reference",
        payment.payment_reference
      );

      /* ----------------------------------------------------------
         3. REDIRECT TO PAYSTACK
      ---------------------------------------------------------- */

      window.location.href =
        payment.authorization_url;
    } catch (err) {
      console.error(
        "Checkout error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while preparing your order.";

      setError(
        message ||
          "Something went wrong while preparing your order. Please try again."
      );

      setPlacingOrder(false);
    }
  }

  /* ==============================================================
     LOADING
  ============================================================== */

  if (
    authLoading ||
    cartLoading ||
    addressesLoading
  ) {
    return (
      <CheckoutLoading
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  /* ==============================================================
     EMPTY CART
  ============================================================== */

  if (items.length === 0) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f4f7fa] !text-slate-950 dark:bg-[#05090e] dark:!text-white">
        <AmbientBackground />

        <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-12 sm:px-6">
          <div className="absolute right-4 top-5 sm:right-8">
            <ThemeToggle
              theme={theme}
              onToggle={toggleTheme}
            />
          </div>

          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#0b1119] sm:p-14">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-cyan-500/10">
              <ShoppingBag className="h-10 w-10 text-cyan-600 dark:text-cyan-300" />
            </div>

            <div className="mx-auto mt-8 max-w-lg">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />

                <span className="text-[10px] font-black uppercase tracking-[0.18em] !text-cyan-700 dark:!text-cyan-300">
                  Checkout
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight !text-slate-950 dark:!text-white sm:text-4xl">
                Your cart is empty
              </h1>

              <p className="mt-4 text-sm leading-7 !text-slate-700 dark:!text-slate-300 sm:text-base">
                Add some products to your
                cart before continuing to
                checkout.
              </p>
            </div>

            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#05627F] via-[#087EA4] to-[#0b8fb7] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ==============================================================
     MAIN CHECKOUT
  ============================================================== */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7fa] !text-slate-950 dark:bg-[#05090e] dark:!text-white">
      <AmbientBackground />

      <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">

        {/* ======================================================
            TOP BAR
        ====================================================== */}

        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/cart"
            className="group inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold !text-slate-700 transition hover:!text-cyan-700 dark:!text-slate-200 dark:hover:!text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Cart
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs font-bold !text-slate-600 sm:flex dark:!text-slate-300">
              <LockKeyhole className="h-4 w-4 text-emerald-500" />
              Secure checkout
            </div>

            <ThemeToggle
              theme={theme}
              onToggle={toggleTheme}
            />
          </div>
        </div>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
            <CreditCard className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-300" />

            <span className="text-[10px] font-black uppercase tracking-[0.2em] !text-cyan-700 dark:!text-cyan-300">
              Secure Checkout
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.04em] !text-slate-950 dark:!text-white sm:text-5xl">
                Complete Your Order
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 !text-slate-700 dark:!text-slate-300">
                Confirm your delivery details,
                choose your preferred shipping
                method, and continue securely
                to payment.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-400/10 dark:bg-emerald-400/[0.05] sm:block">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-black !text-emerald-700 dark:!text-emerald-300">
                  Protected Checkout
                </span>
              </div>

              <p className="mt-1 text-[10px] font-medium !text-slate-600 dark:!text-slate-400">
                Payments handled securely by
                Paystack
              </p>
            </div>
          </div>
        </header>

        <CheckoutSteps />

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm dark:border-red-500/20 dark:bg-red-500/[0.06] dark:text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">
                Checkout could not continue
              </p>

              <p className="mt-1 text-xs font-medium leading-5">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 text-xs font-black opacity-70 transition hover:bg-red-500/10 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_390px]">

          {/* ====================================================
              LEFT
          ==================================================== */}

          <div className="space-y-6">

            {/* ==================================================
                CUSTOMER INFORMATION
            ================================================== */}

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0b1119] sm:p-7">
              <SectionHeading
                number="01"
                icon={
                  <User className="h-5 w-5" />
                }
                eyebrow="Customer"
                title="Contact Information"
                description="Where should we send your order updates?"
              />

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <InputField
                  label="First Name"
                  value={form.firstName}
                  onChange={(value) =>
                    updateField(
                      "firstName",
                      value
                    )
                  }
                  placeholder="Enter your first name"
                  icon={
                    <User className="h-4 w-4" />
                  }
                  required
                />

                <InputField
                  label="Last Name"
                  value={form.lastName}
                  onChange={(value) =>
                    updateField(
                      "lastName",
                      value
                    )
                  }
                  placeholder="Enter your last name"
                  icon={
                    <User className="h-4 w-4" />
                  }
                  required
                />

                <InputField
                  label="Email Address"
                  value={form.email}
                  onChange={(value) =>
                    updateField(
                      "email",
                      value
                    )
                  }
                  placeholder="you@example.com"
                  type="email"
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  required
                />

                <InputField
                  label="Phone Number"
                  value={form.phone}
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value
                    )
                  }
                  placeholder="+234 800 000 0000"
                  type="tel"
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  required
                />
              </div>
            </section>

            {/* ==================================================
                DELIVERY ADDRESS
            ================================================== */}

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0b1119] sm:p-7">
              <SectionHeading
                number="02"
                icon={
                  <MapPin className="h-5 w-5" />
                }
                eyebrow="Delivery"
                title="Shipping Address"
                description="Choose a saved address or enter a new delivery address."
              />

              <div className="mt-7 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (addresses.length) {
                      setAddressMode("saved");
                      setError("");
                    }
                  }}
                  disabled={
                    addresses.length === 0
                  }
                  className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                    addressMode === "saved" &&
                    addresses.length > 0
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                      : "border border-slate-200 bg-slate-50 !text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:!text-slate-300"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Saved Addresses
                </button>

                <button
                  type="button"
                  onClick={
                    switchToNewAddress
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                    addressMode === "new"
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                      : "border border-slate-200 bg-slate-50 !text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:!text-slate-300"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Address
                </button>
              </div>

              {addressMode ===
                "saved" &&
                addresses.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {addresses.map(
                      (address) => {
                        const selected =
                          selectedAddressId ===
                          address.id;

                        return (
                          <button
                            key={
                              address.id
                            }
                            type="button"
                            onClick={() =>
                              selectAddress(
                                address
                              )
                            }
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-cyan-500 bg-cyan-500/[0.06] shadow-[0_10px_35px_rgba(8,126,164,0.08)]"
                                : "border-slate-200 bg-slate-50 hover:border-cyan-300/70 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-cyan-400/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  selected
                                    ? "bg-cyan-500 text-white"
                                    : "bg-slate-100 !text-slate-600 dark:bg-white/[0.06] dark:!text-slate-300"
                                }`}
                              >
                                <MapPin className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-black !text-slate-950 dark:!text-white">
                                    {
                                      address.first_name
                                    }{" "}
                                    {
                                      address.last_name
                                    }
                                  </p>

                                  {address.is_default_shipping && (
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider !text-emerald-700 dark:!text-emerald-300">
                                      Default
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs leading-5 !text-slate-600 dark:!text-slate-300">
                                  {
                                    address.address_line_1
                                  }
                                  {address.address_line_2
                                    ? `, ${address.address_line_2}`
                                    : ""}
                                  ,{" "}
                                  {
                                    address.city
                                  }
                                  ,{" "}
                                  {
                                    address.state
                                  }
                                  ,{" "}
                                  {
                                    address.country
                                  }
                                </p>

                                {address.phone && (
                                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold !text-slate-500 dark:!text-slate-400">
                                    <Phone className="h-3 w-3" />
                                    {
                                      address.phone
                                    }
                                  </p>
                                )}
                              </div>

                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                                  selected
                                    ? "border-cyan-500 bg-cyan-500 text-white"
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {selected && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}

                    <Link
                      href="/account/addresses"
                      className="inline-flex items-center gap-2 text-xs font-black !text-cyan-700 transition hover:!text-cyan-500 dark:!text-cyan-300"
                    >
                      Manage saved addresses
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

              {addressMode ===
                "new" && (
                <div className="mt-7 space-y-5">
                  <InputField
                    label="Street Address"
                    value={
                      form.address
                    }
                    onChange={(value) =>
                      updateField(
                        "address",
                        value
                      )
                    }
                    placeholder="House number, street name, landmark..."
                    icon={
                      <MapPin className="h-4 w-4" />
                    }
                    required
                  />

                  <InputField
                    label="Address Line 2"
                    value={
                      form.addressLine2
                    }
                    onChange={(value) =>
                      updateField(
                        "addressLine2",
                        value
                      )
                    }
                    placeholder="Apartment, suite, floor, etc. (optional)"
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="City"
                      value={
                        form.city
                      }
                      onChange={(value) =>
                        updateField(
                          "city",
                          value
                        )
                      }
                      placeholder="Lagos"
                      required
                    />

                    <InputField
                      label="State"
                      value={
                        form.state
                      }
                      onChange={(value) =>
                        updateField(
                          "state",
                          value
                        )
                      }
                      placeholder="Lagos State"
                      required
                    />

                    <InputField
                      label="Postal Code"
                      value={
                        form.postalCode
                      }
                      onChange={(value) =>
                        updateField(
                          "postalCode",
                          value
                        )
                      }
                      placeholder="Optional"
                    />

                    <InputField
                      label="Country"
                      value={
                        form.country
                      }
                      onChange={(value) =>
                        updateField(
                          "country",
                          value
                        )
                      }
                      placeholder="Nigeria"
                      required
                    />
                  </div>
                </div>
              )}

              {addresses.length ===
                0 && (
                <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-400/10 dark:bg-cyan-400/[0.05]">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-300" />

                    <div>
                      <p className="text-sm font-black !text-slate-950 dark:!text-white">
                        No saved addresses
                      </p>

                      <p className="mt-1 text-xs leading-5 !text-slate-600 dark:!text-slate-300">
                        Enter your delivery
                        address below. It will
                        be saved to your account
                        for future orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {addressMode ===
                "saved" &&
                addresses.length >
                  0 && (
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/[0.035]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />

                      <span className="text-[11px] font-bold !text-slate-600 dark:!text-slate-300">
                        Address secured to your
                        account
                      </span>
                    </div>

                    <ChevronDown className="h-4 w-4 rotate-[-90deg] !text-slate-400" />
                  </div>
                )}
            </section>

            {/* ==================================================
                DELIVERY METHOD
            ================================================== */}

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0b1119] sm:p-7">
              <SectionHeading
                number="03"
                icon={
                  <Truck className="h-5 w-5" />
                }
                eyebrow="Shipping"
                title="Delivery Method"
                description="Choose how you'd like your order delivered."
              />

              <div className="mt-7 space-y-3">
                {(
                  Object.entries(
                    DELIVERY_OPTIONS
                  ) as [
                    DeliveryMethod,
                    (typeof DELIVERY_OPTIONS)[DeliveryMethod]
                  ][]
                ).map(
                  ([
                    key,
                    option,
                  ]) => {
                    const selected =
                      deliveryMethod ===
                      key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setDeliveryMethod(
                            key
                          )
                        }
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 ${
                          selected
                            ? "border-cyan-500 bg-cyan-500/[0.08] shadow-[0_10px_35px_rgba(8,126,164,0.10)]"
                            : "border-slate-200 bg-slate-50 hover:border-cyan-300/70 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-cyan-400/30"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-cyan-500 text-white"
                              : "bg-slate-100 !text-slate-600 dark:bg-white/[0.06] dark:!text-slate-300"
                          }`}
                        >
                          <Truck className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black !text-slate-950 dark:!text-white">
                              {
                                option.label
                              }
                            </p>

                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider !text-slate-600 dark:bg-white/[0.06] dark:!text-slate-300">
                              Calculated
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-5 !text-slate-600 dark:!text-slate-300">
                            {
                              option.description
                            }
                          </p>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected
                              ? "border-cyan-500 bg-cyan-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selected && (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/10 dark:bg-amber-400/[0.04]">
                <p className="text-[11px] font-medium leading-5 !text-amber-800 dark:!text-amber-300">
                  Delivery charges are currently
                  handled by the G-BYT order service.
                  The selected delivery method will
                  be attached to your order.
                </p>
              </div>
            </section>

            {/* ==================================================
                DELIVERY NOTES
            ================================================== */}

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0b1119] sm:p-7">
              <SectionHeading
                number="04"
                icon={
                  <Package className="h-5 w-5" />
                }
                eyebrow="Instructions"
                title="Delivery Notes"
                description="Optional instructions for your delivery."
              />

              <div className="mt-7">
                <textarea
                  value={
                    form.deliveryNotes
                  }
                  onChange={(event) =>
                    updateField(
                      "deliveryNotes",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Add a landmark, preferred delivery instruction, or anything the courier should know..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium !text-slate-950 shadow-sm outline-none transition placeholder:!text-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/20 dark:bg-[#111923] dark:!text-white dark:placeholder:!text-slate-400"
                />
              </div>
            </section>

            {/* ==================================================
                PAYMENT
            ================================================== */}

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0b1119] sm:p-7">
              <SectionHeading
                number="05"
                icon={
                  <CreditCard className="h-5 w-5" />
                }
                eyebrow="Payment"
                title="Secure Payment"
                description="You'll be redirected to Paystack to complete payment."
              />

              <div className="mt-7 flex items-center gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-400/10 dark:bg-cyan-400/[0.05]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
                  <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                </div>

                <div>
                  <p className="text-sm font-black !text-slate-950 dark:!text-white">
                    Pay securely with Paystack
                  </p>

                  <p className="mt-1 text-xs leading-5 !text-slate-600 dark:!text-slate-300">
                    Card, bank transfer, USSD
                    and other supported payment
                    methods will be available on
                    the secure payment page.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold !text-slate-600 dark:!text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Your payment details are handled
                securely by Paystack.
              </div>
            </section>
          </div>

          {/* ====================================================
              RIGHT — ORDER SUMMARY
          ==================================================== */}

          <aside className="lg:sticky lg:top-6">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-[#0b1119]">
              <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-[70px]" />

              <div className="relative">

                {/* SUMMARY HEADER */}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-cyan-700 dark:!text-cyan-400">
                      Your Order
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight !text-slate-950 dark:!text-white">
                      Summary
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                    <ShoppingBag className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>

                {/* PRODUCTS */}

                <div className="mt-7 max-h-[330px] space-y-3 overflow-y-auto pr-1">
                  {items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.025]"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-white/[0.05]">
                          {item.primary_image
                            ?.url ? (
                            <img
                              src={
                                item
                                  .primary_image
                                  .url
                              }
                              alt={
                                item
                                  .primary_image
                                  .alt_text ||
                                item.product_name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-5 w-5 !text-slate-500 dark:!text-slate-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-extrabold !text-slate-950 dark:!text-white">
                            {
                              item.product_name
                            }
                          </p>

                          {item.variant && (
                            <p className="mt-0.5 line-clamp-1 text-[10px] font-medium !text-slate-500 dark:!text-slate-400">
                              {
                                item.variant
                              }
                            </p>
                          )}

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium !text-slate-600 dark:!text-slate-300">
                              Qty:{" "}
                              {
                                item.quantity
                              }
                            </span>

                            <span className="text-xs font-black !text-slate-950 dark:!text-white">
                              {formatPrice(
                                Number(
                                  item.line_total
                                )
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* PRICING */}

                <div className="my-6 h-px bg-slate-200 dark:bg-white/10" />

                <div className="space-y-4">
                  <SummaryRow
                    label={`Items (${itemCount})`}
                    value={formatPrice(
                      subtotalAmount
                    )}
                  />

                  <SummaryRow
                    label="Delivery"
                    value={
                      shippingAmount ===
                      0
                        ? "Calculated"
                        : formatPrice(
                            shippingAmount
                          )
                    }
                  />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium !text-slate-700 dark:!text-slate-300">
                      Method
                    </span>

                    <span className="text-right text-xs font-extrabold !text-slate-900 dark:!text-white">
                      {
                        DELIVERY_OPTIONS[
                          deliveryMethod
                        ].label
                      }
                    </span>
                  </div>
                </div>

                <div className="my-6 h-px bg-slate-200 dark:bg-white/10" />

                {/* GRAND TOTAL */}

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold !text-slate-600 dark:!text-slate-300">
                      Current Order Total
                    </p>

                    <p className="mt-1 text-3xl font-black tracking-tight !text-slate-950 dark:!text-white">
                      {formatPrice(
                        totalAmount
                      )}
                    </p>
                  </div>

                  <div className="mb-1 rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider !text-cyan-700 dark:!text-cyan-300">
                    NGN
                  </div>
                </div>

                {/* PLACE ORDER */}

                <button
                  type="button"
                  onClick={
                    handlePlaceOrder
                  }
                  disabled={
                    placingOrder
                  }
                  className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#05627F] via-[#087EA4] to-[#0b8fb7] px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-900/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-900/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {addressMode ===
                      "new"
                        ? "Saving Address..."
                        : "Preparing Payment..."}
                    </>
                  ) : (
                    <>
                      Place Order & Pay
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* SECURITY */}

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-100 p-3 dark:bg-white/[0.035]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                  <p className="text-[11px] font-medium leading-5 !text-slate-600 dark:!text-slate-300">
                    By placing your order,
                    you confirm that your
                    delivery information is
                    accurate and agree to
                    proceed to secure payment.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <LockKeyhole className="h-3.5 w-3.5 text-emerald-500" />

                  <span className="text-[10px] font-bold !text-slate-500 dark:!text-slate-400">
                    Secure payment connection
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/cart"
              className="group mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold !text-slate-700 backdrop-blur-xl transition hover:border-cyan-300 hover:!text-cyan-700 dark:border-white/10 dark:bg-white/[0.03] dark:!text-slate-200 dark:hover:!text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to Cart
            </Link>
          </aside>
        </div>

        {/* FOOTER */}

        <footer className="mt-10 flex items-center justify-center gap-2 pb-4 text-xs font-medium !text-slate-600 dark:!text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />

          <span>
            Secure G by T shopping experience
          </span>
        </footer>
      </div>
    </main>
  );
}

/* ===============================================================
   THEME TOGGLE
================================================================ */

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-cyan-400/30 dark:hover:text-cyan-300"
    >
      <span className="absolute inset-0 rounded-xl bg-cyan-400/0 transition group-hover:bg-cyan-400/[0.06]" />

      {isDark ? (
        <Sun className="relative h-4 w-4 text-cyan-300" />
      ) : (
        <Moon className="relative h-4 w-4 text-cyan-700" />
      )}
    </button>
  );
}

/* ===============================================================
   BACKGROUND
================================================================ */

function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-cyan-400/[0.08] blur-[130px]" />

      <div className="absolute right-[-220px] top-[20%] h-[550px] w-[550px] rounded-full bg-blue-500/[0.08] blur-[130px]" />

      <div className="absolute bottom-[-250px] left-[25%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />

      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(#0f172a 1px, transparent 1px)",
          backgroundSize:
            "24px 24px",
        }}
      />
    </div>
  );
}

/* ===============================================================
   CHECKOUT STEPS
================================================================ */

function CheckoutSteps() {
  const steps = [
    {
      number: "01",
      label: "Details",
    },
    {
      number: "02",
      label: "Delivery",
    },
    {
      number: "03",
      label: "Payment",
    },
  ];

  return (
    <div className="mb-7 flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/[0.08] dark:bg-[#0b1119]">
      {steps.map(
        (step, index) => (
          <div
            key={step.number}
            className="flex flex-1 items-center"
          >
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-white shadow-sm">
                <Check className="h-3.5 w-3.5" />
              </div>

              <span className="hidden text-xs font-extrabold !text-slate-800 dark:!text-white sm:block">
                {step.label}
              </span>
            </div>

            {index <
              steps.length - 1 && (
              <div className="h-px w-4 bg-slate-300 dark:bg-white/10 sm:w-10" />
            )}
          </div>
        )
      )}
    </div>
  );
}

/* ===============================================================
   SECTION HEADING
================================================================ */

function SectionHeading({
  number,
  icon,
  eyebrow,
  title,
  description,
}: {
  number: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#05627F] to-[#36C5E8] text-white shadow-lg shadow-cyan-900/10">
        {icon}

        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-[8px] font-black text-white dark:border-[#0b1119]">
          {number}
        </span>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-cyan-700 dark:!text-cyan-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-black tracking-tight !text-slate-950 dark:!text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 !text-slate-600 dark:!text-slate-300">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ===============================================================
   INPUT FIELD
================================================================ */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  icon?: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider !text-slate-700 dark:!text-slate-200">
        {label}

        {required && (
          <span className="ml-1 font-black text-cyan-600 dark:text-cyan-400">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 !text-slate-500 dark:!text-slate-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-300 bg-white py-3.5 text-sm font-medium !text-slate-950 shadow-sm outline-none transition placeholder:!text-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/20 dark:bg-[#111923] dark:!text-white dark:placeholder:!text-slate-400 ${
            icon
              ? "pl-10 pr-4"
              : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

/* ===============================================================
   SUMMARY ROW
================================================================ */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium !text-slate-700 dark:!text-slate-300">
        {label}
      </span>

      <span className="text-sm font-extrabold !text-slate-950 dark:!text-white">
        {value}
      </span>
    </div>
  );
}

/* ===============================================================
   LOADING
================================================================ */

function CheckoutLoading({
  theme,
  onToggleTheme,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f4f7fa] dark:bg-[#05090e]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />
        </div>

        <div className="mb-10 mt-6 h-5 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />

        <div className="mb-10">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />

          <div className="mt-3 h-12 w-72 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <div className="space-y-6">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-56 animate-pulse rounded-[1.75rem] bg-slate-200/70 dark:bg-white/[0.06]"
                />
              )
            )}
          </div>

          <div className="h-[600px] animate-pulse rounded-[1.75rem] bg-slate-200/70 dark:bg-white/[0.06]" />
        </div>
      </div>
    </main>
  );
}