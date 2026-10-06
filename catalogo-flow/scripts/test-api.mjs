import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN ?? "http://127.0.0.1:3000";
function client() {
  return { cookie: "" };
}
async function call(
  path,
  {
    method = "GET",
    body,
    client: session = client(),
    requestOrigin = origin,
  } = {},
) {
  const headers = { Origin: requestOrigin };
  if (session.cookie) headers.Cookie = session.cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(origin + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const cookie = response.headers.get("set-cookie");
  if (cookie) session.cookie = cookie.split(";")[0];
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { response, data, cookie };
}
const a = client(),
  b = client(),
  anonymous = client(),
  password = crypto.randomUUID() + "Aa!";
for (const path of [
  "/",
  "/login",
  "/loja/bistro-brasilia",
  "/images/burger.jpg",
  "/images/fries.jpg",
  "/images/pizza.jpg",
  "/images/dessert.jpg",
  "/favicon.svg",
])
  assert.equal((await fetch(origin + path)).status, 200, path);
assert.equal(
  (await fetch(origin + "/dashboard", { redirect: "manual" })).status,
  307,
);
const username = "test_" + crypto.randomUUID().replaceAll("-", "").slice(0, 12);
assert.equal(
  (await call("/api/orders", { client: anonymous })).response.status,
  401,
);
assert.equal(
  (
    await call("/api/auth/register", {
      method: "POST",
      requestOrigin: "https://invalid.example",
      body: {},
    })
  ).response.status,
  403,
);
const register = await call("/api/auth/register", {
  method: "POST",
  client: a,
  body: { username, displayName: "Marcos", password },
});
assert.equal(register.response.status, 201, JSON.stringify(register.data));
assert.match(register.cookie, /HttpOnly/i);
assert.match(register.cookie, /SameSite=Lax/i);
const slugA = register.data.store.slug;
const demo = await call("/api/auth/demo", { method: "POST", client: b });
assert.equal(demo.response.status, 200, JSON.stringify(demo.data));
const slugB = demo.data.store.slug;
assert.notEqual(slugA, slugB);
const payload = {
  storeSlug: slugA,
  items: [{ productId: "burger", quantity: 2 }],
  customerName: "Cliente de teste",
  deliveryAddress: "",
  fulfillment: "pickup",
  idempotencyKey: crypto.randomUUID(),
};
assert.equal(
  (
    await call("/api/checkout", {
      method: "POST",
      client: a,
      body: {
        ...payload,
        items: [{ productId: "burger", quantity: 2, price: 0.01 }],
      },
    })
  ).response.status,
  400,
);
const placed = await call("/api/checkout", {
  method: "POST",
  client: a,
  body: payload,
});
assert.equal(placed.response.status, 200, JSON.stringify(placed.data));
assert.equal(placed.data.order.totalCents, 6580);
const repeated = await call("/api/checkout", {
  method: "POST",
  client: a,
  body: payload,
});
assert.equal(repeated.data.order.id, placed.data.order.id);
assert.equal(
  (
    await call("/api/checkout", {
      method: "POST",
      client: a,
      body: { ...payload, customerName: "Outra pessoa" },
    })
  ).response.status,
  409,
);
assert.equal((await call("/api/orders", { client: b })).data.orders.length, 0);
const id = placed.data.order.id;
assert.equal(
  (
    await call(`/api/orders/${id}`, {
      method: "PATCH",
      client: b,
      body: { status: "preparing" },
    })
  ).response.status,
  404,
);
assert.equal(
  (
    await call(`/api/orders/${id}`, {
      method: "PATCH",
      client: a,
      body: { status: "completed" },
    })
  ).response.status,
  409,
);
for (const status of ["preparing", "ready", "completed"])
  assert.equal(
    (
      await call(`/api/orders/${id}`, {
        method: "PATCH",
        client: a,
        body: { status },
      })
    ).response.status,
    200,
  );
assert.equal(
  (
    await call(`/api/orders/${id}`, {
      method: "PATCH",
      client: a,
      body: { status: "new" },
    })
  ).response.status,
  409,
);
assert.equal(
  (
    await call("/api/products/burger", {
      method: "PATCH",
      client: a,
      body: { available: false },
    })
  ).response.status,
  200,
);
assert.equal(
  (
    await call("/api/checkout", {
      method: "POST",
      client: a,
      body: { ...payload, idempotencyKey: crypto.randomUUID() },
    })
  ).response.status,
  409,
);
const oldCookie = a.cookie;
assert.equal(
  (await call("/api/auth/logout", { method: "POST", client: a })).response
    .status,
  200,
);
assert.equal(
  (await call("/api/orders", { client: { cookie: oldCookie } })).response
    .status,
  401,
);
assert.equal(
  (
    await call("/api/auth/login", {
      method: "POST",
      client: a,
      body: { username, password: "invalid-password" },
    })
  ).response.status,
  401,
);
assert.equal(
  (
    await call("/api/auth/login", {
      method: "POST",
      client: a,
      body: { username, password },
    })
  ).response.status,
  200,
);
assert.equal((await call("/api/orders", { client: a })).data.orders.length, 1);
console.log(
  "API integration passed: registration, session, login/logout, origin checks, store isolation, trusted prices, idempotency, availability and order transitions.",
);
