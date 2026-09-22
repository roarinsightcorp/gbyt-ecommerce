
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  addToCart,
  clearCart as clearCartRequest,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/api/cart";

import { useAuthContext } from "@/providers/auth-provider";

import type {
  AddToCartPayload,
  Cart,
  CartItem,
} from "@/types/cart";

interface CartContextValue {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;

  isLoading: boolean;

  addItem: (
    payload: AddToCartPayload
  ) => Promise<CartItem>;

  updateItem: (
    itemId: number,
    quantity: number
  ) => Promise<CartItem>;

  removeItem: (
    itemId: number
  ) => Promise<void>;

  clearCart: () => Promise<Cart>;

  refreshCart: () => Promise<Cart | null>;
}

const CartContext =
  createContext<CartContextValue | undefined>(
    undefined
  );

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuthContext();

  const [cart, setCart] =
    useState<Cart | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  /**
   * Load the authenticated user's cart.
   *
   * Authentication is handled entirely by
   * HttpOnly cookies through the API client.
   */
  const refreshCart = useCallback(
    async (): Promise<Cart | null> => {
      if (!isAuthenticated) {
        setCart(null);
        return null;
      }

      setIsLoading(true);

      try {
        const currentCart =
          await getCart();

        setCart(currentCart);

        return currentCart;
      } catch (error) {
        console.error(
          "Failed to load cart:",
          error
        );

        setCart(null);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Load the cart when authentication
   * becomes available.
   */
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    void refreshCart();
  }, [
    isAuthenticated,
    isAuthLoading,
    refreshCart,
  ]);

  /**
   * Add a product variant to the cart.
   *
   * The API returns the newly created/updated
   * CartItem, so we refresh the full Cart afterward.
   */
  const addItem = useCallback(
    async (
      payload: AddToCartPayload
    ): Promise<CartItem> => {
      if (!isAuthenticated) {
        throw new Error(
          "Authentication is required to add items to the cart."
        );
      }

      const addedItem =
        await addToCart(payload);

      await refreshCart();

      return addedItem;
    },
    [
      isAuthenticated,
      refreshCart,
    ]
  );

  /**
   * Update a cart item's quantity.
   *
   * The API expects:
   *
   * {
   *   quantity: number
   * }
   *
   * and returns the updated CartItem.
   */
  const updateItem = useCallback(
    async (
      itemId: number,
      quantity: number
    ): Promise<CartItem> => {
      if (!isAuthenticated) {
        throw new Error(
          "Authentication is required to update the cart."
        );
      }

      const updatedItem =
        await updateCartItem(
          itemId,
          {
            quantity,
          }
        );

      await refreshCart();

      return updatedItem;
    },
    [
      isAuthenticated,
      refreshCart,
    ]
  );

  /**
   * Remove a cart item.
   *
   * The API returns void, so we refresh the
   * complete cart afterward.
   */
  const removeItem = useCallback(
    async (
      itemId: number
    ): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error(
          "Authentication is required to modify the cart."
        );
      }

      await removeCartItem(itemId);

      await refreshCart();
    },
    [
      isAuthenticated,
      refreshCart,
    ]
  );

  /**
   * Clear the entire cart.
   *
   * This endpoint returns the updated Cart directly.
   */
  const clearCart = useCallback(
    async (): Promise<Cart> => {
      if (!isAuthenticated) {
        throw new Error(
          "Authentication is required to clear the cart."
        );
      }

      const updatedCart =
        await clearCartRequest();

      setCart(updatedCart);

      return updatedCart;
    },
    [isAuthenticated]
  );

  const items =
    cart?.items ?? [];

  const itemCount = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const subtotal =
    Number(cart?.subtotal ?? 0);

  const value: CartContextValue = {
    cart,
    items,
    itemCount,
    subtotal,
    isLoading,

    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider"
    );
  }

  return context;
}
