"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Globe,
  Loader2,
  Package,
  Save,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api/client";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent?: number | null;
  parent_name?: string | null;
  is_active: boolean;
};

type CategoryResponse = {
  results?: Category[];
  count?: number;
};

type ProductType = "PHYSICAL" | "DIGITAL" | "HYBRID";

type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

type ProductForm = {
  name: string;
  description: string;
  short_description: string;
  category: string;
  brand: string;
  product_type: ProductType;
  status: ProductStatus;
  is_featured: boolean;
  is_active: boolean;
  metadata: string;
  seo_title: string;
  seo_description: string;
};

const INITIAL_FORM: ProductForm = {
  name: "",
  description: "",
  short_description: "",
  category: "",
  brand: "",
  product_type: "PHYSICAL",
  status: "DRAFT",
  is_featured: false,
  is_active: false,
  metadata: "{}",
  seo_title: "",
  seo_description: "",
};

export default function CreateProductPage() {
  const router = useRouter();

  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await apiGet<CategoryResponse>(
          "/categories/",
          false,
        );

        setCategories(response.results ?? []);
      } catch {
        setError(
          "We couldn't load categories. You can still save the product without a category.",
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const query = categorySearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query)
    );
  });

  function updateField<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleProductTypeChange(type: ProductType) {
    setForm((current) => ({
      ...current,
      product_type: type,
      is_active: current.is_active,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    let metadata: Record<string, unknown>;

    try {
      metadata = JSON.parse(form.metadata || "{}");

      if (
        metadata === null ||
        Array.isArray(metadata) ||
        typeof metadata !== "object"
      ) {
        setError("Metadata must be a JSON object.");
        return;
      }
    } catch {
      setError("Metadata contains invalid JSON.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        short_description: form.short_description.trim(),
        category: form.category ? Number(form.category) : null,
        brand: form.brand.trim(),
        product_type: form.product_type,
        status: form.status,
        is_featured: form.is_featured,
        is_active: form.is_active,
        metadata,
        seo_title: form.seo_title.trim(),
        seo_description: form.seo_description.trim(),
      };

      const product = await apiPost<{
        id: number;
        slug: string;
        name: string;
      }>("/admin/products/", payload, true);

      setSuccess("Product created successfully.");

      window.setTimeout(() => {
        router.push(`/admin/products/${product.slug}`);
      }, 500);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We couldn't create the product. Please check the form and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Header />

      {error && <Alert type="error" message={error} />}

      {success && <Alert type="success" message={success} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Section
              icon={<FileText size={18} />}
              title="Basic information"
              description="Define the core information customers and administrators will see."
            >
              <div className="space-y-5">
                <Field
                  label="Product name"
                  required
                  hint="The primary name shown throughout the catalogue."
                >
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="e.g. A4 Premium Notebook"
                    className={inputClass}
                    maxLength={255}
                    required
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Brand"
                    hint="Optional brand or manufacturer."
                  >
                    <input
                      value={form.brand}
                      onChange={(event) =>
                        updateField("brand", event.target.value)
                      }
                      placeholder="e.g. G by T"
                      className={inputClass}
                      maxLength={255}
                    />
                  </Field>

                  <Field
                    label="Short description"
                    hint="Used in catalogue cards and summaries."
                  >
                    <input
                      value={form.short_description}
                      onChange={(event) =>
                        updateField(
                          "short_description",
                          event.target.value,
                        )
                      }
                      placeholder="A concise product description"
                      className={inputClass}
                      maxLength={500}
                    />
                  </Field>
                </div>

                <Field
                  label="Description"
                  hint="Provide the detailed product description."
                >
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Describe the product, its intended use, specifications and other relevant information..."
                    className={`${inputClass} min-h-[180px] resize-y`}
                  />
                </Field>
              </div>
            </Section>

            <Section
              icon={<Package size={18} />}
              title="Product configuration"
              description="Tell G-BYT how this product behaves in the catalogue."
            >
              <div className="space-y-5">
                <Field
                  label="Product type"
                  hint="This controls whether the product has physical and/or digital fulfilment."
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <TypeCard
                      value="PHYSICAL"
                      title="Physical"
                      description="Requires physical fulfilment."
                      selected={form.product_type === "PHYSICAL"}
                      onClick={() =>
                        handleProductTypeChange("PHYSICAL")
                      }
                    />

                    <TypeCard
                      value="DIGITAL"
                      title="Digital"
                      description="Delivered digitally."
                      selected={form.product_type === "DIGITAL"}
                      onClick={() =>
                        handleProductTypeChange("DIGITAL")
                      }
                    />

                    <TypeCard
                      value="HYBRID"
                      title="Hybrid"
                      description="Physical and digital."
                      selected={form.product_type === "HYBRID"}
                      onClick={() =>
                        handleProductTypeChange("HYBRID")
                      }
                    />
                  </div>
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Category"
                    hint="Optional. Categories can also be managed separately."
                  >
                    <div className="space-y-2">
                      <div className="relative">
                        <Search
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                        />

                        <input
                          value={categorySearch}
                          onChange={(event) =>
                            setCategorySearch(event.target.value)
                          }
                          placeholder="Search categories..."
                          className={`${inputClass} pl-9`}
                        />
                      </div>

                      <div className="relative">
                        <select
                          value={form.category}
                          onChange={(event) =>
                            updateField(
                              "category",
                              event.target.value,
                            )
                          }
                          disabled={loadingCategories}
                          className={inputClass}
                        >
                          <option value="">
                            {loadingCategories
                              ? "Loading categories..."
                              : "No category"}
                          </option>

                          {filteredCategories.map((category) => (
                            <option
                              key={category.id}
                              value={category.id}
                            >
                              {category.parent_name
                                ? `${category.parent_name} → `
                                : ""}
                              {category.name}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/25"
                        />
                      </div>
                    </div>
                  </Field>

                  <Field
                    label="Publishing status"
                    hint="Draft products remain unpublished until activated."
                  >
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target.value as ProductStatus,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </Field>
                </div>
              </div>
            </Section>

            <Section
              icon={<Globe size={18} />}
              title="Search engine optimisation"
              description="Optional metadata for search engines and product sharing."
            >
              <div className="space-y-5">
                <Field
                  label="SEO title"
                  hint={`${form.seo_title.length}/255 characters`}
                >
                  <input
                    value={form.seo_title}
                    onChange={(event) =>
                      updateField(
                        "seo_title",
                        event.target.value,
                      )
                    }
                    placeholder="Product name | G-BYT"
                    className={inputClass}
                    maxLength={255}
                  />
                </Field>

                <Field
                  label="SEO description"
                  hint={`${form.seo_description.length}/500 characters`}
                >
                  <textarea
                    value={form.seo_description}
                    onChange={(event) =>
                      updateField(
                        "seo_description",
                        event.target.value,
                      )
                    }
                    placeholder="A concise search-engine description for this product..."
                    className={`${inputClass} min-h-[120px] resize-y`}
                    maxLength={500}
                  />
                </Field>
              </div>
            </Section>

            <Section
              icon={<Sparkles size={18} />}
              title="Metadata"
              description="Optional structured data for future catalogue integrations."
            >
              <Field
                label="JSON metadata"
                hint="Must be a valid JSON object."
              >
                <textarea
                  value={form.metadata}
                  onChange={(event) =>
                    updateField("metadata", event.target.value)
                  }
                  spellCheck={false}
                  className={`${inputClass} min-h-[150px] resize-y font-mono text-xs leading-6`}
                />
              </Field>
            </Section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[#0786AD]/20 bg-[#0786AD]/10 p-2 text-[#39D5F2]">
                  <Tag size={17} />
                </div>

                <div>
                  <h2 className="font-semibold">Publishing</h2>
                  <p className="text-xs text-white/35">
                    Control catalogue visibility.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Toggle
                  checked={form.is_active}
                  onChange={(checked) =>
                    updateField("is_active", checked)
                  }
                  title="Visible in catalogue"
                  description="Allow the product to be treated as active."
                />

                <Toggle
                  checked={form.is_featured}
                  onChange={(checked) =>
                    updateField("is_featured", checked)
                  }
                  title="Featured product"
                  description="Mark this product for featured placements."
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <h2 className="font-semibold">After creation</h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                The product editor will let you configure variants,
                option values, media, relationships and additional
                catalogue settings.
              </p>

              <div className="mt-5 space-y-3">
                <ChecklistItem text="Product information" />
                <ChecklistItem text="Category and publishing" />
                <ChecklistItem text="SEO metadata" />
                <ChecklistItem text="Variants and pricing" muted />
                <ChecklistItem text="Media and relationships" muted />
              </div>
            </div>

            <div className="rounded-2xl border border-[#0786AD]/20 bg-[#0786AD]/[0.06] p-5">
              <p className="text-xs leading-5 text-white/45">
                Product creation is handled by the authenticated admin
                API. Pricing, SKU and inventory are managed through the
                variant and inventory domains after the product exists.
              </p>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-white/[0.08] bg-[#071016]/90 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowLeft size={16} />
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0786AD] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#05647F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Creating product..." : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Header() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-[#39D5F2] transition hover:text-[#7DE8FA]"
      >
        <ArrowLeft size={15} />
        Back to products
      </Link>

      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#0786AD]/20 bg-[#0786AD]/10 p-2.5 text-[#39D5F2]">
            <Package size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create product
            </h1>

            <p className="mt-1 text-sm text-white/40">
              Add the core catalogue information before configuring
              variants, media and relationships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <div className="border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-white/[0.08] bg-white/[0.035] p-2 text-white/45">
            {icon}
          </div>

          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-white/35">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-white/75">
          {label}
          {required && (
            <span className="ml-1 text-[#39D5F2]">*</span>
          )}
        </label>

        {hint && (
          <span className="text-[11px] text-white/30">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function TypeCard({
  value,
  title,
  description,
  selected,
  onClick,
}: {
  value: ProductType;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#0786AD]/50 bg-[#0786AD]/10"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#0786AD] text-white">
          <Check size={12} />
        </span>
      )}

      <span
        className={`block text-sm font-semibold ${
          selected ? "text-[#7DE8FA]" : "text-white/75"
        }`}
      >
        {title}
      </span>

      <span className="mt-1 block text-xs leading-5 text-white/35">
        {description}
      </span>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.04]"
    >
      <span>
        <span className="block text-sm font-medium text-white/70">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-white/30">
          {description}
        </span>
      </span>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#0786AD]" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function ChecklistItem({
  text,
  muted = false,
}: {
  text: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${
        muted ? "text-white/25" : "text-white/55"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          muted
            ? "border border-white/10"
            : "bg-emerald-400/10 text-emerald-300"
        }`}
      >
        {!muted && <Check size={12} />}
      </span>

      {text}
    </div>
  );
}

function Alert({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        type === "error"
          ? "border-red-400/20 bg-red-400/10 text-red-200"
          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      }`}
    >
      {message}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#0786AD] focus:ring-1 focus:ring-[#0786AD]/20";