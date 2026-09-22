
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent: number | null;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: number;
  media_type: string;
  url: string;
  alt_text: string | null;
  title: string | null;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  compare_at_price: string | null;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  is_active: boolean;
  is_default: boolean;
  metadata: Record<string, unknown> | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description: string | null;
  category: Category;
  brand: string | null;
  product_type: string;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  primary_image?: ProductMedia | null;
  has_physical_item?: boolean;
  has_digital_item?: boolean;
  metadata?: Record<string, unknown> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  variants?: ProductVariant[];
  media?: ProductMedia[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}