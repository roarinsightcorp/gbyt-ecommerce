export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  is_active: boolean;
  is_default: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  brand: string;
  product_type: string;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  category: number | null;
  variants: ProductVariant[];
}

export interface CartItem {
  id: number;
  variant: number;
  sku: string;
  product_name: string;
  product_slug: string;
  variant_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  primary_image: string | null;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: string;
  item_count: number;
}

export interface Address {
  id: number;
  address_type: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Payment {
  id: number;
  reference: string;
  status: string;
  amount: string;
  currency: string;
  authorization_url: string | null;
  access_code: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  currency: string;
  subtotal: string;
  shipping_fee: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_phone: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string;
  customer_note: string;
  items: OrderItem[];
  payment: Payment | null;
}