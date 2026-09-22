import type { ProductMedia } from "./product";

export interface CartItem {
id: number;
variant: number;
sku: string;
product_name: string;
product_slug: string;
unit_price: string;
quantity: number;
line_total: string;
primary_image: {
id: number;
url: string;
alt_text: string | null;
title: string | null;
} | null;
created_at: string;
updated_at: string;
}

export interface Cart {
id: number;
items: CartItem[];
subtotal: string;
total: string;
item_count: number;
created_at: string;
updated_at: string;
}

export interface AddToCartPayload {
variant: number;
quantity: number;
}

export interface UpdateCartItemPayload {
quantity: number;
}
