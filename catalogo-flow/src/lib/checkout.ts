import type { Product, StoreInfo, Order } from "@/types/store";
import { money, cents } from "./catalog";
export function priceOrder(
  items: { productId: string; quantity: number }[],
  catalog: Product[],
  fulfillment: "delivery" | "pickup",
) {
  const ids = new Set<string>();
  const priced = items.map((item) => {
    if (ids.has(item.productId))
      throw new Error("Há itens duplicados na sacola.");
    ids.add(item.productId);
    const product = catalog.find((p) => p.id === item.productId);
    if (!product || !product.available)
      throw new Error(
        "Um item está indisponível. Atualize o catálogo e revise a sacola.",
      );
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    )
      throw new Error("Quantidade inválida.");
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      priceCents: cents(product.price),
    };
  });
  if (priced.length === 0) throw new Error("A sacola está vazia.");
  const deliveryFeeCents = fulfillment === "delivery" ? 500 : 0;
  return {
    items: priced,
    deliveryFeeCents,
    totalCents:
      priced.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) +
      deliveryFeeCents,
  };
}
export function whatsappMessage(order: Order, store: StoreInfo) {
  return [
    `*Pedido ${order.id.slice(0, 8).toUpperCase()} · ${store.name}*`,
    store.isDemo ? "*DEMONSTRAÇÃO · sem cobrança*" : "",
    "",
    `Cliente: ${order.customerName}`,
    order.fulfillment === "delivery"
      ? `Entrega: ${order.deliveryAddress}`
      : "Retirada no local",
    "",
    ...order.items.map(
      (i) =>
        `${i.quantity}x ${i.name} · ${money((i.priceCents * i.quantity) / 100)}`,
    ),
    "",
    `Entrega: ${money(order.deliveryFeeCents / 100)}`,
    `Total: ${money(order.totalCents / 100)}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
export function whatsappUrl(number: string, message: string) {
  if (!/^[1-9]\d{9,14}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
