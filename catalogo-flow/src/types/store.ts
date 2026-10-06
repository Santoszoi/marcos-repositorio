export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  available: boolean;
}
export interface CartItem {
  product: Product;
  quantity: number;
}
export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  currency: string;
  isDemo: boolean;
}
export type OrderStatus =
  "new" | "preparing" | "ready" | "completed" | "cancelled";
export interface Order {
  id: string;
  customerName: string;
  deliveryAddress: string;
  fulfillment: "delivery" | "pickup";
  items: {
    productId: string;
    name: string;
    quantity: number;
    priceCents: number;
  }[];
  totalCents: number;
  deliveryFeeCents: number;
  status: OrderStatus;
  createdAt: number;
}
export interface Merchant {
  id: string;
  username: string;
  displayName: string;
  isDemo: boolean;
}
