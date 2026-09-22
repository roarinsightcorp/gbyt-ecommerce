"use client";

import {
useEffect,
useMemo,
useState,
} from "react";

import { useAuthContext } from "@/providers/auth-provider";
import AuthRequiredModal from "@/components/auth/auth-required-modal";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { getProduct } from "@/lib/api/products";
import type {
Product,
ProductVariant,
} from "@/types/product";
import { addToCart } from "@/lib/api/cart";

function formatPrice(price: string) {
const amount = Number(price);

if (Number.isNaN(amount)) {
return price;
}

return new Intl.NumberFormat("en-NG", {
style: "currency",
currency: "NGN",
maximumFractionDigits: 2,
}).format(amount);
}

export default function ProductDetailPage() {
    const { isAuthenticated } = useAuthContext();
    const {
        addItem: addToCart,
        isLoading: isCartUpdating,
        } = useCart();
    const router = useRouter();

    const [showAuthModal, setShowAuthModal] = useState(false);

    const params = useParams();
    const slug = params.slug as string;

    const [product, setProduct] =
    useState<Product | null>(null);

    const [loading, setLoading] =
    useState(true);

    const [error, setError] =
    useState<string | null>(null);

    const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);

    const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

    const [quantity, setQuantity] =
    useState(1);

    useEffect(() => {
    let mounted = true;


    async function loadProduct() {
    try {
        setLoading(true);
        setError(null);

        const response = await getProduct(slug);

        if (!mounted) return;

        setProduct(response);

        const defaultVariant =
        response.variants?.find(
            (variant) => variant.is_default
        ) ??
        response.variants?.[0] ??
        null;

        setSelectedVariant(defaultVariant);

        const primaryImage =
        response.primary_image?.url ??
        response.media?.[0]?.url ??
        null;

        setSelectedImage(primaryImage);
    } catch (err) {
        console.error(
        "Failed to load product:",
        err
        );

        if (mounted) {
        setError(
            "We couldn't load this product."
        );
        }
    } finally {
        if (mounted) {
        setLoading(false);
        }
    }
    }

    if (slug) {
    loadProduct();
    }

    return () => {
    mounted = false;
    };


    }, [slug]);

    const images = useMemo(() => {
    if (!product) return [];


    const mediaImages =
    product.media
        ?.filter(
        (media) =>
            media.is_active &&
            media.url
        )
        .map((media) => ({
        id: media.id,
        url: media.url,
        alt:
            media.alt_text ||
            product.name,
        })) ?? [];

    if (
    product.primary_image?.url &&
    !mediaImages.some(
        (image) =>
        image.url ===
        product.primary_image?.url
    )
    ) {
    mediaImages.unshift({
        id: product.primary_image.id,
        url: product.primary_image.url,
        alt:
        product.primary_image.alt_text ||
        product.name,
    });
    }

    return mediaImages;


    }, [product]);

    if (loading) {
    return ( <main className="min-h-screen bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8"> <div className="mx-auto max-w-[1440px]"> <div className="grid animate-pulse gap-10 lg:grid-cols-2"> <div className="aspect-square rounded-[32px] bg-[var(--surface-muted)]" />


            <div className="space-y-5 py-6">
            <div className="h-4 w-32 rounded bg-[var(--surface-muted)]" />
            <div className="h-12 w-3/4 rounded bg-[var(--surface-muted)]" />
            <div className="h-5 w-full rounded bg-[var(--surface-muted)]" />
            <div className="h-5 w-2/3 rounded bg-[var(--surface-muted)]" />
            <div className="h-12 w-40 rounded bg-[var(--surface-muted)]" />
            <div className="h-14 w-full rounded bg-[var(--surface-muted)]" />
            </div>
        </div>
        </div>
    </main>
    );


    }

    if (error || !product) {
    return ( <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4"> <div className="w-full max-w-lg rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[0_20px_55px_rgba(7,21,29,0.08)]"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primarySoft)] text-2xl font-extrabold text-[var(--primary)]">
    G </div>


        <h1 className="mt-6 text-2xl font-bold text-[var(--heading)]">
            Product unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {error ||
            "This product could not be found."}
        </p>

        <Link
            href="/products"
            className="mt-7 inline-flex rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--primaryDeep)]"
        >
            Back to products
        </Link>
        </div>
    </main>
    );


    }

    const currentPrice =
    selectedVariant?.price ?? null;


    const comparePrice =
    selectedVariant?.compare_at_price ??
    null;
    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
            }
        if (!selectedVariant) {
        return;
        }

        try {
        await addToCart({
        variant: selectedVariant.id,
        quantity,
        });

        
        console.log("Product added to cart.");
        

        } catch (error) {
        console.error("Unable to add product to cart:", error);
        }
        };

return ( 
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"> <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Breadcrumb */} 
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]"> 
            <Link
                href="/"
                className="transition hover:text-[var(--primary)]"
            > Home </Link>


      <span>/</span>

      <Link
        href="/products"
        className="transition hover:text-[var(--primary)]"
      >
        Products
      </Link>

      <span>/</span>

      <span className="font-medium text-[var(--foreground)]">
        {product.name}
      </span>
    </nav>

    <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Product gallery */}
      <div>
        <div className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_55px_rgba(7,21,29,0.08)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--primaryGlow)]/10 blur-3xl" />

          <div className="relative aspect-square overflow-hidden bg-[var(--surface-muted)]">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="h-full w-full object-contain p-8 transition-transform duration-500 hover:scale-[1.025] sm:p-12"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[var(--primarySoft)] text-4xl font-extrabold text-[var(--primary)]">
                  G
                </div>
              </div>
            )}

            {product.is_featured && (
              <span className="absolute left-5 top-5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg">
                Featured
              </span>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-5 gap-3">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setSelectedImage(
                    image.url
                  )
                }
                className={`aspect-square overflow-hidden rounded-2xl border bg-[var(--surface)] transition ${
                  selectedImage === image.url
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product information */}
      <div className="flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-3">
          {product.category && (
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
              {product.category.name}
            </span>
          )}

          {product.brand && (
            <>
              <span className="h-1 w-1 rounded-full bg-[var(--muted-light)]" />

              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {product.brand}
              </span>
            </>
          )}
        </div>

        <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.045em] text-[var(--heading)] sm:text-5xl">
          {product.name}
        </h1>

        {product.short_description && (
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
            {product.short_description}
          </p>
        )}

        {/* Price */}
        <div className="mt-8 flex flex-wrap items-end gap-3">
          {currentPrice ? (
            <>
              <span className="text-3xl font-extrabold tracking-[-0.03em] text-[var(--heading)]">
                {formatPrice(currentPrice)}
              </span>

              {comparePrice && (
                <span className="pb-1 text-base text-[var(--muted-light)] line-through">
                  {formatPrice(comparePrice)}
                </span>
              )}
            </>
          ) : (
            <span className="text-lg font-semibold text-[var(--muted)]">
              Price unavailable
            </span>
          )}
        </div>

        {/* Variants */}
        {product.variants &&
          product.variants.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--heading)]">
                  Select variant
                </h2>

                {selectedVariant && (
                  <span className="text-xs text-[var(--muted)]">
                    {selectedVariant.sku}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {product.variants
                  .filter(
                    (variant) =>
                      variant.is_active
                  )
                  .map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() =>
                        setSelectedVariant(
                          variant
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selectedVariant?.id ===
                        variant.id
                          ? "border-[var(--primary)] bg-[var(--primarySoft)] text-[var(--primaryDeep)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <span className="block text-sm font-semibold">
                        {variant.name}
                      </span>

                      <span className="mt-1 block text-xs opacity-70">
                        {formatPrice(
                          variant.price
                        )}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

        {/* Quantity and cart */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="flex h-14 items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 sm:w-36">
            <button
              type="button"
              onClick={() =>
                setQuantity(
                  (value) =>
                    Math.max(1, value - 1)
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span className="text-sm font-bold">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                setQuantity(
                  (value) => value + 1
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

            <button
            type="button"
            onClick={handleAddToCart}
            disabled={isCartUpdating || !product.variants?.length}
            >
            {isCartUpdating
                ? "Adding..."
                : "Add to Cart"}
            </button>
        </div>

        {/* Product metadata */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Product type
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {product.product_type}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Availability
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--primary)]">
              {product.is_active
                ? "Available"
                : "Unavailable"}
            </p>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-10 border-t border-[var(--border)] pt-8">
            <h2 className="text-xl font-bold text-[var(--heading)]">
              About this product
            </h2>

            <div className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">
              {product.description}
            </div>
          </div>
        )}
      </div>
    </section>
  </div>
  <AuthRequiredModal
    open={showAuthModal}
    onClose={() => setShowAuthModal(false)}
    onSignIn={() => {
    setShowAuthModal(false);
    router.push("/login");
    }}
    onCreateAccount={() => {
    setShowAuthModal(false);
    router.push("/register");
    }}
    />

</main>


);
}
