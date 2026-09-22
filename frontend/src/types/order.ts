export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type PaymentProvider = "PAYSTACK";

export type PaymentTransactionStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "ABANDONED"
  | "REFUNDED";

export interface OrderItem {
  id: number;
  variant: number;
  product_name: string;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  created_at: string;
}

export interface Payment {
  reference: string;
  provider: PaymentProvider;
  status: PaymentTransactionStatus;
  amount: string;
  currency: string;
  authorization_url: string | null;
  access_code: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;

  status: OrderStatus;
  payment_status: PaymentStatus;

  currency: string;

  subtotal: string;
  shipping_fee: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;

  shipping_first_name: string;
  shipping_last_name: string;
  shipping_phone: string | null;

  shipping_address_line_1: string;
  shipping_address_line_2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string | null;

  customer_note: string | null;

  items: OrderItem[];

  payment: Payment | null;

  created_at: string;
  updated_at: string;

  paid_at: string | null;
  cancelled_at: string | null;
}

export interface CheckoutPayload {
  shipping_address_id?: number | null;
  customer_note?: string;
}

export interface PaymentInitialization {
  order_number: string;
  payment_reference: string;
  authorization_url: string;
  access_code: string;
  amount: string;
  currency: string;
}

export interface PaymentVerification {
  order_number: string;
  payment_reference: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  gateway_status: string;
}