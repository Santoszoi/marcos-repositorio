import "server-only";
import { db } from "./db";
import { products, showcaseStore, cents } from "./catalog";
import type { Product, StoreInfo, Merchant, Order } from "@/types/store";

export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string | null;
  is_demo: number;
}
interface StoreRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  is_demo: number;
}
export const merchant = (u: UserRow): Merchant => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  isDemo: Boolean(u.is_demo),
});
const storeInfo = (s: StoreRow): StoreInfo => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  whatsappNumber: s.whatsapp_number,
  currency: "BRL",
  isDemo: Boolean(s.is_demo),
});
export async function getStore(slug: string) {
  if (slug === showcaseStore.slug) return { store: showcaseStore, products };
  const s = await db()
    .prepare("SELECT * FROM stores WHERE slug = ?")
    .bind(slug)
    .first<StoreRow>();
  if (!s) return null;
  const rows = await db()
    .prepare("SELECT * FROM products WHERE store_id = ? ORDER BY rowid")
    .bind(s.id)
    .all<{
      id: string;
      name: string;
      description: string;
      price_cents: number;
      image_url: string;
      category: string;
      available: number;
    }>();
  return {
    store: storeInfo(s),
    products: rows.results.map(
      (p) =>
        ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price_cents / 100,
          imageUrl: p.image_url,
          category: p.category,
          available: Boolean(p.available),
        }) satisfies Product,
    ),
  };
}
export async function ownerStore(userId: string) {
  const row = await db()
    .prepare("SELECT * FROM stores WHERE owner_id = ? LIMIT 1")
    .bind(userId)
    .first<StoreRow>();
  return row ? getStore(row.slug) : null;
}
export async function createMerchant(
  username: string,
  displayName: string,
  passwordHash: string | null,
  isDemo: boolean,
): Promise<UserRow> {
  const userId = crypto.randomUUID(),
    storeId = crypto.randomUUID();
  const slug = `${isDemo ? "demo" : "loja"}-${storeId.replaceAll("-", "").slice(0, 16)}`;
  const user = {
    id: userId,
    username,
    display_name: displayName,
    password_hash: passwordHash,
    is_demo: isDemo ? 1 : 0,
  };
  await db().batch([
    db()
      .prepare(
        "INSERT INTO users (id,username,display_name,password_hash,is_demo,created_at) VALUES (?,?,?,?,?,?)",
      )
      .bind(
        userId,
        username,
        displayName,
        passwordHash,
        user.is_demo,
        Date.now(),
      ),
    db()
      .prepare(
        "INSERT INTO stores (id,owner_id,name,slug,whatsapp_number,is_demo) VALUES (?,?,?,?,?,?)",
      )
      .bind(
        storeId,
        userId,
        isDemo ? "Bistrô Brasília" : `Loja de ${displayName}`,
        slug,
        "",
        1,
      ),
    ...products.map((p) =>
      db()
        .prepare(
          "INSERT INTO products (store_id,id,name,description,price_cents,image_url,category,available) VALUES (?,?,?,?,?,?,?,?)",
        )
        .bind(
          storeId,
          p.id,
          p.name,
          p.description,
          cents(p.price),
          p.imageUrl,
          p.category,
          p.available ? 1 : 0,
        ),
    ),
  ]);
  return user;
}
export async function listOrders(storeId: string): Promise<Order[]> {
  const result = await db()
    .prepare(
      "SELECT * FROM orders WHERE store_id = ? ORDER BY created_at DESC LIMIT 100",
    )
    .bind(storeId)
    .all<Record<string, unknown>>();
  return result.results.map(orderFromRow);
}
export function orderFromRow(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    customerName: String(row.customer_name),
    deliveryAddress: String(row.delivery_address),
    fulfillment: row.fulfillment as Order["fulfillment"],
    items: JSON.parse(String(row.items_json)),
    totalCents: Number(row.total_cents),
    deliveryFeeCents: Number(row.delivery_fee_cents),
    status: row.status as Order["status"],
    createdAt: Number(row.created_at),
  };
}
