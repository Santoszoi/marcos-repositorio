import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  isDemo: integer("is_demo").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});
export const stores = sqliteTable(
  "stores",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    whatsappNumber: text("whatsapp_number").notNull().default(""),
    isDemo: integer("is_demo").notNull().default(1),
  },
  (t) => [index("stores_owner_idx").on(t.ownerId)],
);
export const catalogProducts = sqliteTable(
  "products",
  {
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceCents: integer("price_cents").notNull(),
    imageUrl: text("image_url").notNull(),
    category: text("category").notNull(),
    available: integer("available").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.storeId, t.id] })],
);
export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    requestHash: text("request_hash").notNull(),
    customerName: text("customer_name").notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    fulfillment: text("fulfillment").notNull(),
    itemsJson: text("items_json").notNull(),
    totalCents: integer("total_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("orders_store_time_idx").on(t.storeId, t.createdAt),
    uniqueIndex("orders_idempotency_idx").on(t.storeId, t.idempotencyKey),
  ],
);
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  hits: integer("hits").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
