"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers3,
  Link2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";

type ProductType =
  | "PHYSICAL"
  | "DIGITAL"
  | "HYBRID";

type ProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent?: number | null;
  parent_name?: string | null;
  is_active: boolean;
};

type ProductOptionValue = {
  id: number;
  value: string;
  slug: string;
  active: boolean;
  sort_order: number;
};

type ProductOption = {
  id: number;
  name: string;
  slug: string;
  required: boolean;
  active: boolean;
  sort_order: number;
  values: ProductOptionValue[];
};

type VariantOptionValue = {
  id: number;
  option: number;
  option_name?: string;
  value: number;
  value_name?: string;
};

type ProductVariant = {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  price: string;
  compare_at_price?: string | null;
  cost_price?: string | null;
  weight?: string | null;
  length?: string | null;
  width?: string | null;
  height?: string | null;
  is_active: boolean;
  is_default: boolean;
  metadata?: Record<string, unknown>;
  option_values?: VariantOptionValue[];
};

type ProductMedia = {
  id: number;
  media_type:
    | "IMAGE"
    | "VIDEO"
    | "DOCUMENT";
  url: string;
  storage_key?: string | null;
  alt?: string;
  title?: string;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
  metadata?: Record<string, unknown>;
};

type ProductRelationship = {
  id: number;
  target_product: number;
  target_product_name?: string;
  relationship_type:
    | "RELATED"
    | "COMPLEMENTARY"
    | "ACCESSORY"
    | "ALTERNATIVE"
    | "UPSELL"
    | "CROSS_SELL"
    | "REPLACEMENT";
  sort_order: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: Category | null;
  brand: string;
  product_type: ProductType;
  status: ProductStatus;
  is_featured: boolean;
  is_active: boolean;
  has_physical_item: boolean;
  has_digital_item: boolean;
  metadata: Record<string, unknown>;
  seo_title: string;
  seo_description: string;
  options: ProductOption[];
  variants: ProductVariant[];
  media: ProductMedia[];
  relationships: ProductRelationship[];
  created_at: string;
  updated_at: string;
};

type ProductUpdatePayload = Partial<
  Omit<Product, "category"> & {
    category: number | null;
  }
>;
type CategoryResponse = {
  results?: Category[];
};

type ProductSearchResponse = {
  results?: Product[];
};

const PRODUCT_TYPES: Array<{
  value: ProductType;
  title: string;
  description: string;
}> = [
  {
    value: "PHYSICAL",
    title: "Physical",
    description:
      "Requires physical fulfilment.",
  },
  {
    value: "DIGITAL",
    title: "Digital",
    description:
      "Delivered digitally.",
  },
  {
    value: "HYBRID",
    title: "Hybrid",
    description:
      "Physical and digital fulfilment.",
  },
];

const RELATIONSHIP_TYPES = [
  "RELATED",
  "COMPLEMENTARY",
  "ACCESSORY",
  "ALTERNATIVE",
  "UPSELL",
  "CROSS_SELL",
  "REPLACEMENT",
] as const;

/**
 * Build the canonical admin product URL.
 *
 * Product detail routes are slug-based throughout the application.
 * Never use product.id for this URL.
 */
function getProductAdminUrl(slug: string) {
  return `/admin/products/${encodeURIComponent(slug)}`;
}

/**
 * Normalise a Next.js dynamic route parameter.
 *
 * With the route:
 *
 *   /admin/products/[slug]/page.tsx
 *
 * Next.js gives us:
 *
 *   params.slug
 *
 * This helper also protects against the parameter temporarily
 * being unavailable during client rendering.
 */
function getRouteSlug(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function formatDate(value: string): string {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ProductEditorPage() {
  const params = useParams<{
    slug: string;
  }>();

  const router = useRouter();

  /**
   * IMPORTANT:
   *
   * This page lives at:
   *
   *   /admin/products/[slug]
   *
   * Therefore the route identifier is the product slug,
   * not the database ID.
   */
  const productSlug = useMemo(
    () => getRouteSlug(params?.slug),
    [params?.slug],
  );
  const [product, setProduct] =
    useState<Product | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [activeSection, setActiveSection] =
    useState<
      | "overview"
      | "options"
      | "variants"
      | "media"
      | "relationships"
    >("overview");

  /**
   * Prevent older requests from overwriting newer data.
   *
   * This matters when:
   * - the user refreshes quickly;
   * - a slug changes;
   * - React re-runs an effect;
   * - multiple requests are triggered close together.
   */
  const [requestVersion, setRequestVersion] =
    useState(0);

  /**
   * Load the product by its canonical slug.
   */
  const loadProduct = useCallback(
    async (options?: {
      initial?: boolean;
      silent?: boolean;
    }) => {
      if (!productSlug) {
        setProduct(null);
        setError(
          "No product slug was provided in the URL.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const isInitialLoad =
        options?.initial ?? false;

      const requestId = requestVersion + 1;
      setRequestVersion(requestId);

      try {
        if (isInitialLoad) {
          setLoading(true);
        } else if (!options?.silent) {
          setRefreshing(true);
        }

        setError("");

        const response = await apiGet<Product>(
          getProductAdminUrl(productSlug),
          true,
        );

        /**
         * Ignore an older response if a newer request has
         * already been started.
         */
        if (requestId !== requestVersion + 1) {
          return;
        }

        setProduct(response);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load this product.";

        setError(message);

        if (isInitialLoad) {
          setProduct(null);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else if (!options?.silent) {
          setRefreshing(false);
        }
      }
    },
    [productSlug, requestVersion],
  );

  /**
   * Load categories independently from the product.
   *
   * A category failure should never prevent the product
   * editor itself from opening.
   */
  const loadCategories =
    useCallback(async () => {
      try {
        const response =
          await apiGet<CategoryResponse>(
            "/categories/",
            false,
          );

        setCategories(response.results ?? []);
      } catch {
        /**
         * Deliberately keep this silent.
         *
         * The current product may still be edited even if
         * category loading temporarily fails.
         */
      }
    }, []);

  /**
   * Load product and supporting category data whenever
   * the route slug changes.
   */
  useEffect(() => {
    if (!productSlug) {
      return;
    }

    void loadProduct({
      initial: true,
    });

    void loadCategories();
  }, [
    productSlug,
    loadProduct,
    loadCategories,
  ]);

  /**
   * Only active categories should normally be selectable.
   *
   * However, preserve the product's existing category if that
   * category has subsequently been deactivated.
   */
  const categoryOptions = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.is_active ||
          category.id === product?.category?.id,
      ),
    [
      categories,
      product?.category?.id,
    ],
  );

  /**
   * Update the product's core fields.
   *
   * Django remains the source of truth for slug generation.
   *
   * If changing the name causes Django to generate a new slug,
   * the returned object contains the canonical slug and the
   * browser URL is updated accordingly.
   */
  async function updateProduct(
    payload: ProductUpdatePayload,
  ) {
    if (!product) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const currentSlug = product.slug;

      const updated =
        await apiPatch<Product>(
          getProductAdminUrl(currentSlug),
          payload,
          true,
        );

      setProduct(updated);

      setSuccess(
        "Product changes saved successfully.",
      );

      /**
       * The backend owns slug generation.
       *
       * If the slug changed, replace the current URL rather
       * than pushing a second browser-history entry.
       */
      if (updated.slug !== currentSlug) {
        router.replace(
          getProductAdminUrl(updated.slug),
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save product changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  /**
   * Archive the product.
   *
   * The backend performs a soft archive:
   *
   *   status = ARCHIVED
   *   is_active = false
   *
   * It is intentionally not a permanent database deletion.
   */
  async function archiveProduct() {
    if (!product || saving) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive "${product.name}"? This will remove it from the active catalogue without permanently deleting the product.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiDelete(
        getProductAdminUrl(product.slug),
        true,
      );

      router.push("/admin/products");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive this product.",
      );

      setSaving(false);
    }
  }

  /**
   * Loading state.
   */
  if (loading) {
    return <LoadingState />;
  }

  /**
   * Product failed to load.
   */
  if (!product) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-[#39D5F2] transition hover:text-[#7DE8FA]"
        >
          <ArrowLeft size={15} />
          Back to products
        </Link>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 shrink-0 text-red-300"
              size={19}
            />

            <div>
              <h1 className="font-semibold text-red-100">
                Product could not be loaded
              </h1>

              <p className="mt-1 text-sm text-red-100/60">
                {error ||
                  "The requested product does not exist."}
              </p>

              {productSlug && (
                <p className="mt-3 break-all font-mono text-xs text-red-100/40">
                  Requested slug: {productSlug}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadProduct({
                  initial: true,
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-red-300/20 px-4 py-2.5 text-sm font-semibold text-red-100/80 transition hover:bg-red-300/10 hover:text-red-100"
            >
              <RefreshCw size={15} />
              Try again
            </button>

            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white"
            >
              <ArrowLeft size={15} />
              Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-[#39D5F2] transition hover:text-[#7DE8FA]"
        >
          <ArrowLeft size={15} />
          Back to products
        </Link>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-[#0786AD]/20 bg-[#0786AD]/10 p-3 text-[#39D5F2]">
              <Package size={21} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold tracking-tight">
                  {product.name}
                </h1>

                <StatusBadge
                  status={product.status}
                />

                {product.is_featured && (
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[11px] font-medium text-violet-200">
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-1 break-all font-mono text-xs text-white/35">
                /{product.slug}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/30">
                <span>
                  Product #{product.id}
                </span>

                <span>•</span>

                <span>
                  Updated{" "}
                  {formatDate(product.updated_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadProduct()
              }
              disabled={
                refreshing || saving
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() =>
                void archiveProduct()
              }
              disabled={
                saving ||
                refreshing ||
                product.status ===
                  "ARCHIVED"
              }
              className="inline-flex items-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3.5 py-2.5 text-sm text-red-200/70 transition hover:bg-red-400/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={15} />
              Archive
            </button>
          </div>
        </div>
      </header>

      {(error || success) && (
        <Alert
          type={
            error
              ? "error"
              : "success"
          }
          message={
            error || success
          }
          onClose={() => {
            setError("");
            setSuccess("");
          }}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2 xl:sticky xl:top-5">
          <NavigationButton
            active={
              activeSection ===
              "overview"
            }
            icon={
              <Settings2 size={16} />
            }
            label="Overview"
            onClick={() =>
              setActiveSection(
                "overview",
              )
            }
          />

          <NavigationButton
            active={
              activeSection ===
              "options"
            }
            icon={
              <Layers3 size={16} />
            }
            label="Options"
            count={
              product.options.length
            }
            onClick={() =>
              setActiveSection(
                "options",
              )
            }
          />

          <NavigationButton
            active={
              activeSection ===
              "variants"
            }
            icon={
              <Tag size={16} />
            }
            label="Variants"
            count={
              product.variants.length
            }
            onClick={() =>
              setActiveSection(
                "variants",
              )
            }
          />

          <NavigationButton
            active={
              activeSection ===
              "media"
            }
            icon={
              <ImageIcon size={16} />
            }
            label="Media"
            count={
              product.media.length
            }
            onClick={() =>
              setActiveSection(
                "media",
              )
            }
          />

          <NavigationButton
            active={
              activeSection ===
              "relationships"
            }
            icon={
              <Link2 size={16} />
            }
            label="Relationships"
            count={
              product.relationships.length
            }
            onClick={() =>
              setActiveSection(
                "relationships",
              )
            }
          />
        </aside>

        <main className="min-w-0">
          {activeSection ===
            "overview" && (
            <OverviewSection
              product={product}
              categories={
                categoryOptions
              }
              saving={saving}
              onSave={updateProduct}
            />
          )}

          {activeSection ===
            "options" && (
            <OptionsSection
              product={product}
              onProductChange={
                setProduct
              }
              onError={setError}
              onSuccess={
                setSuccess
              }
            />
          )}

          {activeSection ===
            "variants" && (
            <VariantsSection
              product={product}
              onProductChange={
                setProduct
              }
              onError={setError}
              onSuccess={
                setSuccess
              }
            />
          )}

          {activeSection ===
            "media" && (
            <MediaSection
              product={product}
              onProductChange={
                setProduct
              }
              onError={setError}
              onSuccess={
                setSuccess
              }
            />
          )}

          {activeSection ===
            "relationships" && (
            <RelationshipsSection
              product={product}
              onProductChange={
                setProduct
              }
              onError={setError}
              onSuccess={
                setSuccess
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewSection({
  product,
  categories,
  saving,
  onSave,
}: {
  product: Product;
  categories: Category[];
  saving: boolean;
  onSave: (
    payload: ProductUpdatePayload,
  ) => Promise<void>;
}) {
  const [name, setName] =
    useState(product.name);

  const [brand, setBrand] =
    useState(product.brand || "");

  const [shortDescription, setShortDescription] =
    useState(
      product.short_description || "",
    );

  const [description, setDescription] =
    useState(
      product.description || "",
    );

  const [category, setCategory] =
    useState(
      product.category?.id
        ? String(
            product.category.id,
          )
        : "",
    );

  const [productType, setProductType] =
    useState<ProductType>(
      product.product_type,
    );

  const [status, setStatus] =
    useState<ProductStatus>(
      product.status,
    );

  const [featured, setFeatured] =
    useState(
      product.is_featured,
    );

  const [active, setActive] =
    useState(
      product.is_active,
    );

  const [seoTitle, setSeoTitle] =
    useState(
      product.seo_title || "",
    );

  const [seoDescription, setSeoDescription] =
    useState(
      product.seo_description || "",
    );

  const [metadata, setMetadata] =
    useState(
      JSON.stringify(
        product.metadata ?? {},
        null,
        2,
      ),
    );

  const [localError, setLocalError] =
    useState("");

  useEffect(() => {
    setName(product.name);

    setBrand(
      product.brand || "",
    );

    setShortDescription(
      product.short_description ||
        "",
    );

    setDescription(
      product.description || "",
    );

    setCategory(
      product.category?.id
        ? String(
            product.category.id,
          )
        : "",
    );

    setProductType(
      product.product_type,
    );

    setStatus(product.status);

    setFeatured(
      product.is_featured,
    );

    setActive(
      product.is_active,
    );

    setSeoTitle(
      product.seo_title || "",
    );

    setSeoDescription(
      product.seo_description ||
        "",
    );

    setMetadata(
      JSON.stringify(
        product.metadata ?? {},
        null,
        2,
      ),
    );

    setLocalError("");
  }, [product]);

  async function handleSave() {
    if (!name.trim()) {
      setLocalError(
        "Product name is required.",
      );
      return;
    }

    let parsedMetadata:
      | Record<string, unknown>;

    try {
      const parsed = JSON.parse(
        metadata || "{}",
      );

      if (
        parsed === null ||
        Array.isArray(parsed) ||
        typeof parsed !==
          "object"
      ) {
        setLocalError(
          "Metadata must be a JSON object.",
        );
        return;
      }

      parsedMetadata =
        parsed as Record<
          string,
          unknown
        >;
    } catch {
      setLocalError(
        "Metadata contains invalid JSON.",
      );
      return;
    }

    setLocalError("");

    await onSave({
      name: name.trim(),
      brand: brand.trim(),
      short_description:
        shortDescription.trim(),
      description:
        description.trim(),
      category: category
        ? Number(category)
        : null,
      product_type: productType,
      status,
      is_featured: featured,
      is_active: active,
      seo_title: seoTitle.trim(),
      seo_description:
        seoDescription.trim(),
      metadata: parsedMetadata,
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <Settings2 size={18} />
        }
        title="Product overview"
        description="Manage the core product record. Variants, media and relationships are maintained separately."
      />

      {localError && (
        <Alert
          type="error"
          message={localError}
          onClose={() =>
            setLocalError("")
          }
        />
      )}

      <Panel title="Basic information">
        <div className="space-y-5">
          <Field
            label="Product name"
            required
          >
            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              className={inputClass}
              maxLength={255}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Brand">
              <input
                value={brand}
                onChange={(event) =>
                  setBrand(
                    event.target.value,
                  )
                }
                className={inputClass}
                maxLength={255}
              />
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value,
                  )
                }
                className={inputClass}
              >
                <option value="">
                  No category
                </option>

                {categories.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.parent_name
                        ? `${item.parent_name} → `
                        : ""}
                      {item.name}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>

          <Field label="Short description">
            <input
              value={
                shortDescription
              }
              onChange={(event) =>
                setShortDescription(
                  event.target.value,
                )
              }
              className={inputClass}
              maxLength={500}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              className={`${inputClass} min-h-[190px] resize-y`}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Catalogue configuration">
        <div className="space-y-5">
          <Field label="Product type">
            <div className="grid gap-3 md:grid-cols-3">
              {PRODUCT_TYPES.map(
                (type) => (
                  <button
                    key={
                      type.value
                    }
                    type="button"
                    onClick={() =>
                      setProductType(
                        type.value,
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      productType ===
                      type.value
                        ? "border-[#0786AD]/50 bg-[#0786AD]/10"
                        : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {
                          type.title
                        }
                      </span>

                      {productType ===
                        type.value && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0786AD]">
                          <Check
                            size={
                              12
                            }
                          />
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      {
                        type.description
                      }
                    </p>
                  </button>
                ),
              )}
            </div>
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Status">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as ProductStatus,
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="DRAFT">
                  Draft
                </option>
                <option value="ACTIVE">
                  Active
                </option>
                <option value="INACTIVE">
                  Inactive
                </option>
                <option value="ARCHIVED">
                  Archived
                </option>
              </select>
            </Field>

            <div className="space-y-3">
              <Toggle
                checked={active}
                onChange={setActive}
                title="Visible / active"
                description="Controls whether the product is active."
              />

              <Toggle
                checked={featured}
                onChange={
                  setFeatured
                }
                title="Featured"
                description="Allow the product to appear in featured placements."
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="SEO"
        icon={<Globe size={16} />}
      >
        <div className="space-y-5">
          <Field label="SEO title">
            <input
              value={seoTitle}
              onChange={(event) =>
                setSeoTitle(
                  event.target.value,
                )
              }
              className={inputClass}
              maxLength={255}
            />
          </Field>

          <Field label="SEO description">
            <textarea
              value={
                seoDescription
              }
              onChange={(event) =>
                setSeoDescription(
                  event.target.value,
                )
              }
              className={`${inputClass} min-h-[120px] resize-y`}
              maxLength={500}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Metadata"
        icon={
          <FileText size={16} />
        }
      >
        <Field label="JSON metadata">
          <textarea
            value={metadata}
            onChange={(event) =>
              setMetadata(
                event.target.value,
              )
            }
            spellCheck={false}
            className={`${inputClass} min-h-[180px] resize-y font-mono text-xs leading-6`}
          />
        </Field>
      </Panel>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            void handleSave()
          }
          disabled={saving}
          className={primaryButton}
        >
          {saving ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <Save size={16} />
          )}

          {saving
            ? "Saving..."
            : "Save product"}
        </button>
      </div>
    </div>
  );
}

function OptionsSection({
  product,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  onProductChange: React.Dispatch<
    React.SetStateAction<
      Product | null
    >
  >;
  onError: (
    message: string,
  ) => void;
  onSuccess: (
    message: string,
  ) => void;
}) {
  const [creating, setCreating] =
    useState(false);

  const [newName, setNewName] =
    useState("");

  async function createOption() {
    if (!newName.trim()) {
      onError(
        "Option name is required.",
      );
      return;
    }

    try {
      setCreating(true);
      onError("");

      const option =
        await apiPost<ProductOption>(
          `/admin/products/${encodeURIComponent(
            product.slug,
          )}/options/`,
          {
            name: newName.trim(),
            required: false,
            active: true,
            sort_order:
              product.options.length,
          },
          true,
        );

      onProductChange(
        (current) =>
          current
            ? {
                ...current,
                options: [
                  ...current.options,
                  option,
                ],
              }
            : current,
      );

      setNewName("");

      onSuccess(
        "Option created successfully.",
      );
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create option.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <Layers3 size={18} />
        }
        title="Product options"
        description="Define selectable dimensions such as size, colour, pages or pack size. Option values belong to their option."
      />

      <Panel title="Add option">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newName}
            onChange={(event) =>
              setNewName(
                event.target.value,
              )
            }
            placeholder="e.g. Size, Colour, Pack"
            className={`${inputClass} flex-1`}
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();
                void createOption();
              }
            }}
          />

          <button
            type="button"
            onClick={() =>
              void createOption()
            }
            disabled={creating}
            className={primaryButton}
          >
            {creating ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Plus size={16} />
            )}

            Add option
          </button>
        </div>
      </Panel>

      {product.options.length ===
      0 ? (
        <EmptyState
          icon={
            <Layers3 size={20} />
          }
          title="No options yet"
          description="Create options when variants need selectable values."
        />
      ) : (
        <div className="space-y-4">
          {product.options.map(
            (option) => (
              <OptionCard
                key={option.id}
                product={product}
                option={option}
                onProductChange={
                  onProductChange
                }
                onError={onError}
                onSuccess={
                  onSuccess
                }
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function OptionCard({
  product,
  option,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  option: ProductOption;
  onProductChange: React.Dispatch<
    React.SetStateAction<
      Product | null
    >
  >;
  onError: (
    message: string,
  ) => void;
  onSuccess: (
    message: string,
  ) => void;
}) {
  const [name, setName] =
    useState(option.name);

  const [required, setRequired] =
    useState(option.required);

  const [active, setActive] =
    useState(option.active);

  const [newValue, setNewValue] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [addingValue, setAddingValue] =
    useState(false);

  useEffect(() => {
    setName(option.name);
    setRequired(option.required);
    setActive(option.active);
  }, [option]);

  async function saveOption() {
    if (!name.trim()) {
      onError(
        "Option name is required.",
      );
      return;
    }

    try {
      setSaving(true);
      onError("");

      const updated =
        await apiPatch<ProductOption>(
          `/admin/products/${encodeURIComponent(
            product.slug,
          )}/options/${option.id}/`,
          {
            name: name.trim(),
            required,
            active,
            sort_order:
              option.sort_order,
          },
          true,
        );

      onProductChange(
        (current) =>
          current
            ? {
                ...current,
                options:
                  current.options.map(
                    (item) =>
                      item.id ===
                      updated.id
                        ? updated
                        : item,
                  ),
              }
            : current,
      );

      onSuccess(
        "Option updated successfully.",
      );
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update option.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOption() {
    const confirmed =
      window.confirm(
        `Delete "${option.name}" and its values?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      onError("");

      await apiDelete(
        `/admin/products/${encodeURIComponent(
          product.slug,
        )}/options/${option.id}/`,
        true,
      );

      onProductChange(
        (current) =>
          current
            ? {
                ...current,
                options:
                  current.options.filter(
                    (item) =>
                      item.id !==
                      option.id,
                  ),
              }
            : current,
      );

      onSuccess(
        "Option deleted successfully.",
      );
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete option.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addValue() {
    if (!newValue.trim()) {
      onError(
        "Option value is required.",
      );
      return;
    }

    try {
      setAddingValue(true);
      onError("");

      const value =
        await apiPost<ProductOptionValue>(
          `/admin/products/${encodeURIComponent(
            product.slug,
          )}/options/${option.id}/values/`,
          {
            value: newValue.trim(),
            active: true,
            sort_order:
              option.values.length,
          },
          true,
        );

      onProductChange(
        (current) =>
          current
            ? {
                ...current,
                options:
                  current.options.map(
                    (item) =>
                      item.id ===
                      option.id
                        ? {
                            ...item,
                            values: [
                              ...item.values,
                              value,
                            ],
                          }
                        : item,
                  ),
              }
            : current,
      );

      setNewValue("");

      onSuccess(
        "Option value added successfully.",
      );
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add option value.",
      );
    } finally {
      setAddingValue(false);
    }
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              className={inputClass}
              maxLength={255}
            />

            <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs text-white/55">
              <input
                type="checkbox"
                checked={required}
                onChange={(event) =>
                  setRequired(
                    event.target
                      .checked,
                  )
                }
                className="accent-[#0786AD]"
              />
              Required
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs text-white/55">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) =>
                  setActive(
                    event.target
                      .checked,
                  )
                }
                className="accent-[#0786AD]"
              />
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              void saveOption()
            }
            disabled={saving}
            className={smallButton}
          >
            {saving ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Save size={14} />
            )}

            Save
          </button>

          <button
            type="button"
            onClick={() =>
              void deleteOption()
            }
            disabled={saving}
            className={dangerButton}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-white/[0.07] pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">
              Values
            </h3>

            <p className="mt-1 text-xs text-white/30">
              {option.values.length}{" "}
              configured value
              {option.values.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        {option.values.length >
          0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {option.values.map(
              (value) => (
                <OptionValueChip
                  key={value.id}
                  product={product}
                  option={option}
                  value={value}
                  onProductChange={
                    onProductChange
                  }
                  onError={onError}
                  onSuccess={
                    onSuccess
                  }
                />
              ),
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newValue}
            onChange={(event) =>
              setNewValue(
                event.target.value,
              )
            }
            placeholder={`Add ${option.name.toLowerCase()} value`}
            className={`${inputClass} flex-1`}
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();
                void addValue();
              }
            }}
          />

          <button
            type="button"
            onClick={() =>
              void addValue()
            }
            disabled={addingValue}
            className={smallButton}
          >
            {addingValue ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Plus size={14} />
            )}

            Add value
          </button>
        </div>
      </div>
    </Panel>
  );
}

function OptionValueChip({
  product,
  option,
  value,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  option: ProductOption;
  value: ProductOptionValue;
  onProductChange: Dispatch<SetStateAction<Product | null>>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.value);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(value.value);
    }
  }, [value.value, editing]);

  async function save() {
    const nextValue = draft.trim();

    if (!nextValue) {
      onError("Option value cannot be empty.");
      return;
    }

    if (nextValue.length > 255) {
      onError("Option value cannot exceed 255 characters.");
      return;
    }

    try {
      setSaving(true);
      onError("");

      const updated = await apiPatch<ProductOptionValue>(
        `/admin/products/${encodeURIComponent(
          product.slug,
        )}/options/${option.id}/values/${value.id}/`,
        {
          value: nextValue,
          active: value.active,
          sort_order: value.sort_order,
        },
        true,
      );

      onProductChange((current) =>
        current
          ? {
              ...current,
              options: current.options.map((item) =>
                item.id === option.id
                  ? {
                      ...item,
                      values: item.values.map((itemValue) =>
                        itemValue.id === updated.id
                          ? updated
                          : itemValue,
                      ),
                    }
                  : item,
              ),
            }
          : current,
      );

      setDraft(updated.value);
      setEditing(false);
      onSuccess("Option value updated.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update option value.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${value.value}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      onError("");

      await apiDelete(
        `/admin/products/${encodeURIComponent(
          product.slug,
        )}/options/${option.id}/values/${value.id}/`,
        true,
      );

      onProductChange((current) =>
        current
          ? {
              ...current,
              options: current.options.map((item) =>
                item.id === option.id
                  ? {
                      ...item,
                      values: item.values.filter(
                        (itemValue) => itemValue.id !== value.id,
                      ),
                    }
                  : item,
              ),
            }
          : current,
      );

      setEditing(false);
      onSuccess("Option value deleted.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete option value.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#0786AD]/30 bg-[#0786AD]/[0.06] p-1.5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }

            if (event.key === "Escape") {
              setDraft(value.value);
              setEditing(false);
            }
          }}
          maxLength={255}
          className="min-w-0 flex-1 bg-transparent px-2 text-xs text-white outline-none"
          autoFocus
          disabled={saving}
        />

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || deleting}
          className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-40"
          aria-label="Save option value"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setDraft(value.value);
            setEditing(false);
          }}
          disabled={saving || deleting}
          className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 disabled:opacity-40"
          aria-label="Cancel editing"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-1.5">
      <span className="min-w-0 truncate text-xs text-white/65">
        {value.value}
      </span>

      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={deleting}
        className="ml-1 rounded p-1 text-white/20 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white/60 disabled:opacity-40"
        aria-label={`Edit ${value.value}`}
      >
        <Settings2 size={11} />
      </button>

      <button
        type="button"
        onClick={() => void remove()}
        disabled={deleting}
        className="rounded p-1 text-white/20 opacity-0 transition group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
        aria-label={`Delete ${value.value}`}
      >
        {deleting ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Trash2 size={11} />
        )}
      </button>
    </div>
  );
}

function VariantsSection({
  product,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  onProductChange: Dispatch<SetStateAction<Product | null>>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");

  function validateMoneyField(
    value: string,
    label: string,
  ): boolean {
    if (!value.trim()) {
      onError(`${label} is required.`);
      return false;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
      onError(`${label} must be a valid non-negative amount.`);
      return false;
    }

    return true;
  }

  async function createVariant() {
    const trimmedSku = sku.trim();
    const trimmedName = name.trim();

    if (!trimmedSku) {
      onError("SKU is required.");
      return;
    }

    if (trimmedSku.length > 100) {
      onError("SKU cannot exceed 100 characters.");
      return;
    }

    if (!validateMoneyField(price, "Price")) {
      return;
    }

    if (
      compareAtPrice.trim() &&
      !validateMoneyField(compareAtPrice, "Compare-at price")
    ) {
      return;
    }

    if (
      costPrice.trim() &&
      !validateMoneyField(costPrice, "Cost price")
    ) {
      return;
    }

    if (
      compareAtPrice.trim() &&
      Number(compareAtPrice) < Number(price)
    ) {
      onError(
        "Compare-at price must be greater than or equal to the selling price.",
      );
      return;
    }

    try {
      setCreating(true);
      onError("");

      const variant = await apiPost<ProductVariant>(
        `/admin/products/${encodeURIComponent(
          product.slug,
        )}/variants/`,
        {
          name: trimmedName,
          sku: trimmedSku,
          price,
          compare_at_price: compareAtPrice.trim() || null,
          cost_price: costPrice.trim() || null,
          is_active: true,
          is_default: product.variants.length === 0,
          metadata: {},
        },
        true,
      );

      onProductChange((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          variants: [
            ...current.variants.map((item) =>
              variant.is_default
                ? { ...item, is_default: false }
                : item,
            ),
            variant,
          ],
        };
      });

      setName("");
      setSku("");
      setPrice("");
      setCompareAtPrice("");
      setCostPrice("");
      setShowCreate(false);

      onSuccess("Variant created.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create variant.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Tag size={18} />}
        title="Variants"
        description="Pricing, SKU and physical dimensions belong to variants. Inventory quantities remain managed by the inventory domain."
        action={
          <button
            type="button"
            onClick={() => {
              onError("");
              setShowCreate((current) => !current);
            }}
            className={primaryButton}
          >
            {showCreate ? (
              <X size={16} />
            ) : (
              <Plus size={16} />
            )}
            {showCreate ? "Close" : "Add variant"}
          </button>
        }
      />

      {showCreate && (
        <Panel title="Create variant">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Variant name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. A4 Red Ruled"
                maxLength={255}
                className={inputClass}
              />
            </Field>

            <Field label="SKU" required>
              <input
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                placeholder="e.g. EXB-A4-RED"
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field label="Price" required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </Field>

            <Field label="Compare-at price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={compareAtPrice}
                onChange={(event) =>
                  setCompareAtPrice(event.target.value)
                }
                placeholder="Optional"
                className={inputClass}
              />
            </Field>

            <Field label="Cost price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(event) =>
                  setCostPrice(event.target.value)
                }
                placeholder="Optional"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void createVariant()}
              disabled={creating}
              className={primaryButton}
            >
              {creating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {creating ? "Creating..." : "Create variant"}
            </button>
          </div>
        </Panel>
      )}

      {product.variants.length === 0 ? (
        <EmptyState
          icon={<Tag size={20} />}
          title="No variants"
          description="Create at least one variant when the product needs SKU-level pricing or configuration."
        />
      ) : (
        <div className="space-y-4">
          {product.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              product={product}
              variant={variant}
              onProductChange={onProductChange}
              onError={onError}
              onSuccess={onSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VariantCard({
  product,
  variant,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  variant: ProductVariant;
  onProductChange: Dispatch<SetStateAction<Product | null>>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [name, setName] = useState(variant.name || "");
  const [sku, setSku] = useState(variant.sku);
  const [barcode, setBarcode] = useState(variant.barcode || "");
  const [price, setPrice] = useState(variant.price);
  const [compareAtPrice, setCompareAtPrice] = useState(
    variant.compare_at_price || "",
  );
  const [costPrice, setCostPrice] = useState(
    variant.cost_price || "",
  );
  const [weight, setWeight] = useState(variant.weight || "");
  const [length, setLength] = useState(variant.length || "");
  const [width, setWidth] = useState(variant.width || "");
  const [height, setHeight] = useState(variant.height || "");
  const [active, setActive] = useState(variant.is_active);
  const [isDefault, setIsDefault] = useState(
    variant.is_default,
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setName(variant.name || "");
    setSku(variant.sku);
    setBarcode(variant.barcode || "");
    setPrice(variant.price);
    setCompareAtPrice(variant.compare_at_price || "");
    setCostPrice(variant.cost_price || "");
    setWeight(variant.weight || "");
    setLength(variant.length || "");
    setWidth(variant.width || "");
    setHeight(variant.height || "");
    setActive(variant.is_active);
    setIsDefault(variant.is_default);
  }, [
    variant.id,
    variant.name,
    variant.sku,
    variant.barcode,
    variant.price,
    variant.compare_at_price,
    variant.cost_price,
    variant.weight,
    variant.length,
    variant.width,
    variant.height,
    variant.is_active,
    variant.is_default,
  ]);

  function validateNonNegative(
    value: string,
    label: string,
  ): boolean {
    if (!value.trim()) {
      return true;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      onError(`${label} must be a valid non-negative number.`);
      return false;
    }

    return true;
  }

  async function saveVariant() {
    const trimmedSku = sku.trim();

    if (!trimmedSku) {
      onError("SKU is required.");
      return;
    }

    if (trimmedSku.length > 100) {
      onError("SKU cannot exceed 100 characters.");
      return;
    }

    if (!price.trim()) {
      onError("Price is required.");
      return;
    }

    if (!validateNonNegative(price, "Price")) {
      return;
    }

    if (!validateNonNegative(compareAtPrice, "Compare-at price")) {
      return;
    }

    if (!validateNonNegative(costPrice, "Cost price")) {
      return;
    }

    if (!validateNonNegative(weight, "Weight")) {
      return;
    }

    if (!validateNonNegative(length, "Length")) {
      return;
    }

    if (!validateNonNegative(width, "Width")) {
      return;
    }

    if (!validateNonNegative(height, "Height")) {
      return;
    }

    if (
      compareAtPrice.trim() &&
      Number(compareAtPrice) < Number(price)
    ) {
      onError(
        "Compare-at price must be greater than or equal to the selling price.",
      );
      return;
    }

    try {
      setSaving(true);
      onError("");

      const updated = await apiPatch<ProductVariant>(
        `/admin/products/${encodeURIComponent(
          product.slug,
        )}/variants/${variant.id}/`,
        {
          name: name.trim(),
          sku: trimmedSku,
          barcode: barcode.trim() || null,
          price,
          compare_at_price: compareAtPrice.trim() || null,
          cost_price: costPrice.trim() || null,
          weight: weight.trim() || null,
          length: length.trim() || null,
          width: width.trim() || null,
          height: height.trim() || null,
          is_active: active,
          is_default: isDefault,
          metadata: variant.metadata ?? {},
        },
        true,
      );

      onProductChange((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          variants: current.variants.map((item) => {
            if (item.id === updated.id) {
              return updated;
            }

            if (updated.is_default) {
              return {
                ...item,
                is_default: false,
              };
            }

            return item;
          }),
        };
      });

      setIsDefault(updated.is_default);
      onSuccess("Variant saved.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save variant.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeVariant() {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm(
      `Delete variant "${variant.sku}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      onError("");

      await apiDelete(
        `/admin/products/${encodeURIComponent(
          product.slug,
        )}/variants/${variant.id}/`,
        true,
      );

      onProductChange((current) =>
        current
          ? {
              ...current,
              variants: current.variants.filter(
                (item) => item.id !== variant.id,
              ),
            }
          : current,
      );

      onSuccess("Variant deleted.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete variant.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-white/80">
              {variant.sku}
            </span>

            {variant.is_default && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-200">
                Default
              </span>
            )}

            {!variant.is_active && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/35">
                Inactive
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-white/35">
            {variant.name || "Unnamed variant"} ·{" "}
            {formatNaira(variant.price)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onError("");
              setExpanded((current) => !current);
            }}
            disabled={deleting}
            className={smallButton}
          >
            {expanded ? "Collapse" : "Edit"}
            <ChevronDown
              size={14}
              className={`transition ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => void removeVariant()}
            disabled={deleting}
            className={dangerButton}
            aria-label={`Delete variant ${variant.sku}`}
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 border-t border-white/[0.07] pt-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Variant name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={255}
                className={inputClass}
              />
            </Field>

            <Field label="SKU" required>
              <input
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field label="Barcode">
              <input
                value={barcode}
                onChange={(event) =>
                  setBarcode(event.target.value)
                }
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field label="Price" required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Compare-at price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={compareAtPrice}
                onChange={(event) =>
                  setCompareAtPrice(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Cost price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(event) =>
                  setCostPrice(event.target.value)
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-4">
            <Field label="Weight">
              <input
                type="number"
                min="0"
                step="0.001"
                value={weight}
                onChange={(event) =>
                  setWeight(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Length">
              <input
                type="number"
                min="0"
                step="0.001"
                value={length}
                onChange={(event) =>
                  setLength(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Width">
              <input
                type="number"
                min="0"
                step="0.001"
                value={width}
                onChange={(event) =>
                  setWidth(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Height">
              <input
                type="number"
                min="0"
                step="0.001"
                value={height}
                onChange={(event) =>
                  setHeight(event.target.value)
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Toggle
              checked={active}
              onChange={setActive}
              title="Active variant"
              description="Allow this variant to participate in the catalogue."
            />

            <Toggle
              checked={isDefault}
              onChange={setIsDefault}
              title="Default variant"
              description="Use this variant as the product's default selection."
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void saveVariant()}
              disabled={saving || deleting}
              className={primaryButton}
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save variant"}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function MediaSection({
  product,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  onProductChange: Dispatch<SetStateAction<Product | null>>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [mediaType, setMediaType] =
    useState<ProductMedia["media_type"]>("IMAGE");
  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const [primary, setPrimary] = useState(false);
  const [adding, setAdding] = useState(false);

  async function addMedia() {
    const mediaUrl = url.trim();

    if (!mediaUrl) {
      onError("Media URL is required.");
      return;
    }

    try {
      new URL(mediaUrl);
    } catch {
      onError("Enter a valid media URL.");
      return;
    }

    if (mediaType === "IMAGE" && !alt.trim()) {
      onError(
        "Alt text is recommended for product images. Please provide it before adding the image.",
      );
      return;
    }

    try {
      setAdding(true);
      onError("");

      const media = await apiPost<ProductMedia>(
        `/products/${encodeURIComponent(
          product.slug,
        )}/media/upload/`,
        {
          media_type: mediaType,
          url: mediaUrl,
          alt: alt.trim(),
          title: title.trim(),
          is_primary: primary,
          is_active: true,
          sort_order: product.media.length,
          metadata: {},
        },
        true,
      );

      onProductChange((current) => {
        if (!current) {
          return current;
        }

        const nextMedia = primary
          ? [
              ...current.media.map((item) => ({
                ...item,
                is_primary: false,
              })),
              media,
            ]
          : [...current.media, media];

        return {
          ...current,
          media: nextMedia,
        };
      });

      setUrl("");
      setAlt("");
      setTitle("");
      setPrimary(false);

      onSuccess("Media added.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add media.",
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<ImageIcon size={18} />}
        title="Product media"
        description="Manage product images, videos and documents. Media storage can later be connected directly to Bunny Storage."
      />

      <Panel title="Add media">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Media type">
            <select
              value={mediaType}
              onChange={(event) =>
                setMediaType(
                  event.target.value as ProductMedia["media_type"],
                )
              }
              className={inputClass}
            >
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Document</option>
            </select>
          </Field>

          <Field label="Media URL" required>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              type="url"
              className={inputClass}
            />
          </Field>

          <Field label="Alt text">
            <input
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Describe the image for accessibility"
              maxLength={255}
              className={inputClass}
            />
          </Field>

          <Field label="Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Toggle
            checked={primary}
            onChange={setPrimary}
            title="Primary media"
            description="Use this item as the primary product media."
          />

          <button
            type="button"
            onClick={() => void addMedia()}
            disabled={adding}
            className={primaryButton}
          >
            {adding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {adding ? "Adding..." : "Add media"}
          </button>
        </div>
      </Panel>

      {product.media.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={20} />}
          title="No media"
          description="Add product imagery or other media to build the catalogue presentation."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {product.media.map((media) => (
            <MediaCard
              key={media.id}
              product={product}
              media={media}
              onProductChange={onProductChange}
              onError={onError}
              onSuccess={onSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  product,
  media,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  media: ProductMedia;
  onProductChange: Dispatch<SetStateAction<Product | null>>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  void onProductChange;
  void onSuccess;

  async function removeMedia() {
    onError(
      "Media removal is not available through the current backend media contract yet.",
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <div className="aspect-video bg-black/20">
        {media.media_type === "IMAGE" ? (
          <img
            src={media.url}
            alt={media.alt || product.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              onError(
                `Unable to load media "${media.title || media.url}".`,
              );
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">
            {media.media_type}
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-white/65">
            {media.media_type}
          </span>

          {media.is_primary && (
            <span className="rounded-full bg-[#0786AD]/10 px-2 py-1 text-[10px] text-[#7DE8FA]">
              Primary
            </span>
          )}
        </div>

        <p className="truncate text-xs text-white/30">
          {media.title || media.url}
        </p>

        <button
          type="button"
          onClick={() => void removeMedia()}
          className={dangerButton}
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    </div>
  );
}

type AdminProductSearchItem = {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  brand?: string | null;
  status?: ProductStatus;
  product_type?: ProductType;
  is_active?: boolean;
  is_featured?: boolean;
};

function RelationshipsSection({
  product,
  onProductChange,
  onError,
  onSuccess,
}: {
  product: Product;
  onProductChange: Dispatch<SetStateAction<Product | null>>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [products, setProducts] = useState<
    AdminProductSearchItem[]
  >([]);
  const [target, setTarget] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<(typeof RELATIONSHIP_TYPES)[number]>("RELATED");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoadingProducts(true);

        const response = await apiGet<{
          results: AdminProductSearchItem[];
        }>("/admin/products/?ordering=name&page_size=100", true);

        if (cancelled) {
          return;
        }

        setProducts(
          (response.results ?? []).filter(
            (item) => item.id !== product.id,
          ),
        );
      } catch (requestError) {
        if (!cancelled) {
          onError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load products for relationships.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  async function addRelationship() {
    if (!target) {
      onError("Select a target product.");
      return;
    }

    const targetId = Number(target);

    if (!Number.isInteger(targetId) || targetId <= 0) {
      onError("Invalid target product.");
      return;
    }

    if (targetId === product.id) {
      onError("A product cannot be related to itself.");
      return;
    }

    const duplicate = product.relationships.some(
      (relationship) =>
        relationship.target_product === targetId &&
        relationship.relationship_type === relationshipType,
    );

    if (duplicate) {
      onError(
        "This relationship already exists for the selected product.",
      );
      return;
    }

    try {
      setAdding(true);
      onError("");

      const relationship =
        await apiPost<ProductRelationship>(
          `/admin/products/${encodeURIComponent(
            product.slug,
          )}/relationships/`,
          {
            target_product: targetId,
            relationship_type: relationshipType,
            sort_order: product.relationships.length,
            is_active: true,
            metadata: {},
          },
          true,
        );

      onProductChange((current) =>
        current
          ? {
              ...current,
              relationships: [
                ...current.relationships,
                relationship,
              ],
            }
          : current,
      );

      setTarget("");
      onSuccess("Relationship added.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add relationship.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function removeRelationship(
    relationship: ProductRelationship,
  ) {
    const confirmed = window.confirm(
      "Remove this product relationship?",
    );

    if (!confirmed) {
      return;
    }

    try {
      onError("");

      await apiDelete(
        `/admin/products/${encodeURIComponent(
          product.slug,
        )}/relationships/${relationship.id}/`,
        true,
      );

      onProductChange((current) =>
        current
          ? {
              ...current,
              relationships: current.relationships.filter(
                (item) => item.id !== relationship.id,
              ),
            }
          : current,
      );

      onSuccess("Relationship removed.");
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove relationship.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Link2 size={18} />}
        title="Product relationships"
        description="Connect related, complementary, accessory, upsell, cross-sell and replacement products."
      />

      <Panel title="Add relationship">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Target product" required>
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              disabled={loadingProducts || adding}
              className={inputClass}
            >
              <option value="">
                {loadingProducts
                  ? "Loading products..."
                  : products.length === 0
                    ? "No other products available"
                    : "Select product"}
              </option>

              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.status ? ` — ${item.status}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Relationship type">
            <select
              value={relationshipType}
              onChange={(event) =>
                setRelationshipType(
                  event.target.value as (typeof RELATIONSHIP_TYPES)[number],
                )
              }
              disabled={adding}
              className={inputClass}
            >
              {RELATIONSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatRelationshipType(type)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => void addRelationship()}
            disabled={
              adding ||
              loadingProducts ||
              products.length === 0
            }
            className={primaryButton}
          >
            {adding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {adding ? "Adding..." : "Add relationship"}
          </button>
        </div>
      </Panel>

      {product.relationships.length === 0 ? (
        <EmptyState
          icon={<Link2 size={20} />}
          title="No relationships"
          description="Related products can be configured here without mixing relationship data into the core product record."
        />
      ) : (
        <Panel title="Configured relationships">
          <div className="divide-y divide-white/[0.06]">
            {product.relationships.map((relationship) => (
              <div
                key={relationship.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/70">
                    {relationship.target_product_name ||
                      `Product #${relationship.target_product}`}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    {formatRelationshipType(
                      relationship.relationship_type,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void removeRelationship(relationship)
                  }
                  className={dangerButton}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function NavigationButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
        active
          ? "bg-[#0786AD]/10 text-[#7DE8FA]"
          : "text-white/45 hover:bg-white/[0.04] hover:text-white/75"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {icon}

      <span className="flex-1">{label}</span>

      {typeof count === "number" && (
        <span
          className={`text-xs ${
            active ? "text-[#39D5F2]" : "text-white/25"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-2.5 text-white/45">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-semibold">{title}</h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/35">
            {description}
          </p>
        </div>
      </div>

      {action}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      {title && (
        <div className="mb-5 flex items-center gap-2">
          {icon && (
            <span className="text-white/35">
              {icon}
            </span>
          )}

          <h3 className="text-sm font-semibold text-white/75">
            {title}
          </h3>
        </div>
      )}

      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/65">
        {label}

        {required && (
          <span className="ml-1 text-[#39D5F2]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

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
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
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

function StatusBadge({
  status,
}: {
  status: ProductStatus;
}) {
  const classes: Record<ProductStatus, string> = {
    DRAFT:
      "border-amber-400/20 bg-amber-400/10 text-amber-200",
    ACTIVE:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    INACTIVE:
      "border-white/10 bg-white/[0.04] text-white/45",
    ARCHIVED:
      "border-red-400/20 bg-red-400/10 text-red-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.015] p-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/30">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-white/65">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/30">
        {description}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-32 animate-pulse rounded bg-white/[0.05]" />
      <div className="h-10 w-72 animate-pulse rounded bg-white/[0.05]" />

      <div className="grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
        <div className="h-64 animate-pulse rounded-2xl bg-white/[0.025]" />

        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-white/[0.025]" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/[0.025]" />
        </div>
      </div>
    </div>
  );
}

function Alert({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
        type === "error"
          ? "border-red-400/20 bg-red-400/10 text-red-200"
          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      }`}
    >
      <div className="flex items-start gap-2">
        {type === "error" ? (
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0"
          />
        ) : (
          <Check
            size={16}
            className="mt-0.5 shrink-0"
          />
        )}

        <span>{message}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 opacity-60 hover:opacity-100"
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function formatNaira(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `₦${value}`;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRelationshipType(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#0786AD] focus:ring-1 focus:ring-[#0786AD]/20 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0786AD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#05647F] disabled:cursor-not-allowed disabled:opacity-50";

const smallButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50";

const dangerButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs font-medium text-red-200/70 transition hover:bg-red-400/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-40";