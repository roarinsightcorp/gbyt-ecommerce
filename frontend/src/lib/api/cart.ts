import {
apiGet,
apiPost,
apiPatch,
apiDelete,
} from "./client";

import type {
AddToCartPayload,
Cart,
CartItem,
UpdateCartItemPayload,
} from "@/types/cart";

export async function getCart(): Promise<Cart> {
return apiGet<Cart>("/cart/", true);
}

export async function addToCart(
payload: AddToCartPayload
): Promise<CartItem> {
return apiPost<CartItem>("/cart/items/", payload, true);
}

export async function updateCartItem(
itemId: number,
payload: UpdateCartItemPayload
): Promise<CartItem> {
return apiPatch<CartItem>(
`/cart/items/${itemId}/`,
payload,
true
);
}

export async function removeCartItem(
itemId: number
): Promise<void> {
await apiDelete<void>(
`/cart/items/${itemId}/`,
true
);
}

export async function clearCart(): Promise<Cart> {
return apiDelete<Cart>("/cart/", true);
}
