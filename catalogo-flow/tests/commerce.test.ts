import { test } from "node:test";
import assert from "node:assert/strict";
import { cartReducer, restoreCart, cartTotalCents } from "../src/lib/cartState";
import { products, showcaseStore } from "../src/lib/catalog";
import { priceOrder, whatsappMessage, whatsappUrl } from "../src/lib/checkout";
import { checkoutSchema, registerSchema } from "../src/lib/validation";
import { lookupCep, CepError } from "../src/lib/cep";
import { transitions } from "../src/lib/orderState";
import {
  hashPassword,
  verifyPassword,
  randomToken,
  digest,
} from "../src/lib/crypto";

test("adding an existing cart item never mutates the previous state", () => {
  const before = Object.freeze([
    Object.freeze({ product: products[0], quantity: 1 }),
  ]);
  const next = cartReducer(before as never, {
    type: "add",
    product: products[0],
  });
  assert.equal(before[0].quantity, 1);
  assert.equal(next[0].quantity, 2);
  assert.equal(
    cartReducer(next, { type: "remove", productId: products[0].id })[0]
      .quantity,
    1,
  );
  assert.deepEqual(
    cartReducer([{ product: products[0], quantity: 1 }], {
      type: "remove",
      productId: products[0].id,
    }),
    [],
  );
});
test("cart restoration discards forged products, duplicates and bad quantities; totals use integer cents", () => {
  const restored = restoreCart(
    [
      { productId: "burger", quantity: 2 },
      { productId: "burger", quantity: 4 },
      { productId: "fake", quantity: 1 },
      { productId: "fries", quantity: -1 },
    ],
    products,
  );
  assert.equal(restored.length, 1);
  assert.equal(cartTotalCents(restored), 6580);
  assert.equal(
    cartReducer([{ product: products[0], quantity: 20 }], {
      type: "add",
      product: products[0],
    })[0].quantity,
    20,
  );
});
test("server prices reject missing, unavailable and duplicate products", () => {
  assert.equal(
    priceOrder([{ productId: "burger", quantity: 2 }], products, "delivery")
      .totalCents,
    7080,
  );
  assert.throws(() =>
    priceOrder([{ productId: "x", quantity: 1 }], products, "pickup"),
  );
  assert.throws(() =>
    priceOrder(
      [{ productId: "burger", quantity: 1 }],
      [{ ...products[0], available: false }],
      "pickup",
    ),
  );
  assert.throws(() =>
    priceOrder(
      [
        { productId: "burger", quantity: 1 },
        { productId: "burger", quantity: 1 },
      ],
      products,
      "pickup",
    ),
  );
});
test("checkout rejects client-provided prices and noninteger quantities", () => {
  const valid = {
    storeSlug: "demo-shop",
    items: [{ productId: "burger", quantity: 1 }],
    customerName: "Marcos",
    deliveryAddress: "",
    fulfillment: "pickup",
    idempotencyKey: crypto.randomUUID(),
  };
  assert.equal(checkoutSchema.safeParse(valid).success, true);
  assert.equal(
    checkoutSchema.safeParse({
      ...valid,
      items: [{ productId: "burger", quantity: 1, price: 0.01 }],
    }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({
      ...valid,
      items: [{ productId: "burger", quantity: 1.5 }],
    }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({ ...valid, fulfillment: "delivery" }).success,
    false,
  );
});
test("WhatsApp links encode Unicode, ampersands and newlines and require a configured number", () => {
  const order = {
    id: "order-12345",
    customerName: "Marcos & Ana",
    deliveryAddress: "",
    fulfillment: "pickup" as const,
    items: [],
    totalCents: 1234,
    deliveryFeeCents: 0,
    status: "new" as const,
    createdAt: 0,
  };
  const message = whatsappMessage(order, showcaseStore),
    number = "5511000000000";
  const link = whatsappUrl(number, message)!;
  assert.equal(new URL(link).hostname, "wa.me");
  assert.equal(new URL(link).searchParams.get("text"), message);
  assert.equal(whatsappUrl("", message), null);
  assert.equal(whatsappUrl("javascript:alert(1)", message), null);
});
test("CEP validates input, retries transient failures and rejects missing or malformed results", async () => {
  let calls = 0;
  const fake = (async () => {
    calls++;
    return calls === 1
      ? new Response("", { status: 503 })
      : Response.json({
          cep: "01001-000",
          logradouro: "Praça da Sé",
          bairro: "Sé",
          localidade: "São Paulo",
          uf: "SP",
        });
  }) as typeof fetch;
  assert.equal((await lookupCep("01001000", fake)).city, "São Paulo");
  assert.equal(calls, 2);
  await assert.rejects(
    () => lookupCep("../secret", fake),
    (e: unknown) => e instanceof CepError && e.status === 400,
  );
  await assert.rejects(
    () =>
      lookupCep("99999999", (async () =>
        Response.json({ erro: true })) as typeof fetch),
    (e: unknown) => e instanceof CepError && e.status === 404,
  );
  await assert.rejects(
    () =>
      lookupCep("01001000", (async () =>
        Response.json({ city: "unexpected" })) as typeof fetch),
    (e: unknown) => e instanceof CepError && e.status === 503,
  );
});
test("terminal orders cannot reopen", () => {
  assert.deepEqual(transitions.completed, []);
  assert.deepEqual(transitions.cancelled, []);
  assert.equal(transitions.new.includes("completed"), false);
});
test("passwords have independent salts and session tokens are not stored in plaintext", async () => {
  const password = randomToken().slice(0, 30),
    hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.match(hash, /^\$2[aby]\$12\$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
  const token = randomToken();
  assert.notEqual(await digest(token), token);
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(
    registerSchema.safeParse({
      username: "marcos",
      displayName: "Marcos",
      password: "short",
    }).success,
    false,
  );
});
