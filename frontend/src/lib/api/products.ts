
import {
  apiGet,
} from "./client";

import type {
  Category,
  Product,
  PaginatedResponse,
} from "@/types/product";

export interface ProductFilters {
  category?: string;
  product_type?: string;
  featured?: boolean;
  search?: string;
  brand?: string;
  ordering?: string;
  page?: number;
}

function buildQuery(
  filters: ProductFilters = {}
): string {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set(
      "category",
      filters.category
    );
  }

  if (filters.product_type) {
    params.set(
      "product_type",
      filters.product_type
    );
  }

  if (filters.featured !== undefined) {
    params.set(
      "featured",
      String(filters.featured)
    );
  }

  if (filters.search) {
    params.set(
      "search",
      filters.search
    );
  }

  if (filters.brand) {
    params.set(
      "brand",
      filters.brand
    );
  }

  if (filters.ordering) {
    params.set(
      "ordering",
      filters.ordering
    );
  }

  if (filters.page) {
    params.set(
      "page",
      String(filters.page)
    );
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedResponse<Product>> {
  return apiGet<PaginatedResponse<Product>>(
    `/products/${buildQuery(filters)}`
  );
}

export async function getProduct(
  slug: string
): Promise<Product> {
  return apiGet<Product>(
    `/products/${encodeURIComponent(slug)}/`
  );
}

export async function getCategories(): Promise<
  PaginatedResponse<Category>
> {
  return apiGet<PaginatedResponse<Category>>(
    "/categories/"
  );
}

export async function getCategory(
  slug: string
): Promise<Category> {
  return apiGet<Category>(
    `/categories/${encodeURIComponent(slug)}/`
  );
}
