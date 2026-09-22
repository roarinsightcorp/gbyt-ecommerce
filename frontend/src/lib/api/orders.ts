import {
  apiGet,
  apiPost,
} from "./client";

import type {
  CheckoutPayload,
  Order,
  PaymentInitialization,
  PaymentVerification,
} from "@/types/order";

export async function createCheckoutOrder(
  payload: CheckoutPayload
): Promise<Order> {
  return apiPost<Order>(
    "/checkout/",
    payload,
    true
  );
}

export async function getOrders(): Promise<Order[]> {
  const response = await apiGet<unknown>(
    "/orders/",
    true
  );

  return normalizeOrders(response);
}

export async function getOrder(
  orderNumber: string
): Promise<Order> {
  return apiGet<Order>(
    `/orders/${encodeURIComponent(orderNumber)}/`,
    true
  );
}

export async function initializePayment(
  orderNumber: string
): Promise<PaymentInitialization> {
  return apiPost<PaymentInitialization>(
    "/payments/initialize/",
    {
      order_number: orderNumber,
    },
    true
  );
}

export async function verifyPayment(
  reference: string
): Promise<PaymentVerification> {
  return apiGet<PaymentVerification>(
    `/payments/verify/${encodeURIComponent(reference)}/`,
    true
  );
}

function normalizeOrders(
  data: unknown
): Order[] {
  if (Array.isArray(data)) {
    return data as Order[];
  }

  if (
    data &&
    typeof data === "object"
  ) {
    const response = data as {
      results?: unknown;
      orders?: unknown;
      data?: unknown;
    };

    if (Array.isArray(response.results)) {
      return response.results as Order[];
    }

    if (Array.isArray(response.orders)) {
      return response.orders as Order[];
    }

    if (Array.isArray(response.data)) {
      return response.data as Order[];
    }
  }

  console.error(
    "Unexpected orders API response:",
    data
  );

  return [];
}