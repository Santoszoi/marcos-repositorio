import type { CartItem, Product } from "@/types/store";
export type CartAction =
  | { type: "add"; product: Product }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "restore"; items: CartItem[] };
export function cartReducer(cart: CartItem[], action: CartAction): CartItem[] {
  if (action.type === "clear") return [];
  if (action.type === "restore") return action.items;
  if (action.type === "remove")
    return cart
      .map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      )
      .filter((item) => item.quantity > 0);
  if (!action.product.available) return cart;
  const existing = cart.find((item) => item.product.id === action.product.id);
  if (existing)
    return cart.map((item) =>
      item.product.id === action.product.id
        ? { ...item, quantity: Math.min(20, item.quantity + 1) }
        : item,
    );
  return [...cart, { product: action.product, quantity: 1 }];
}
export function restoreCart(raw: unknown, catalog: Product[]): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.productId !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      seen.has(item.productId)
    )
      return [];
    const product = catalog.find((p) => p.id === item.productId && p.available);
    if (!product) return [];
    seen.add(item.productId);
    return [{ product, quantity: Math.min(20, item.quantity) }];
  });
}
export const cartTotalCents = (cart: CartItem[]) =>
  cart.reduce(
    (sum, item) => sum + Math.round(item.product.price * 100) * item.quantity,
    0,
  );
