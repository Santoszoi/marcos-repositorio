import test from "node:test";
import assert from "node:assert/strict";
import {
  initialOrders,
  parseOrders,
  validateOrder,
  changeOrderStatus,
  totalCents,
  orderSummary,
  filterOrders,
  KEY,
} from "../src/lib/service";
import { fetchOrders } from "../src/lib/mockApi";
test("valores em centavos e indicadores excluem ordens canceladas", () => {
  assert.equal(
    totalCents([
      { id: "1", description: "A", quantity: 3, unitPrice: 0.1 },
      { id: "2", description: "B", quantity: 1, unitPrice: 0.2 },
    ]),
    50,
  );
  assert.deepEqual(orderSummary(initialOrders), {
    total: 3,
    running: 1,
    pendingCents: 180000,
    completedCents: 36000,
  });
  const canceled = { ...initialOrders[1], status: "Cancelado" as const };
  assert.equal(orderSummary([canceled]).pendingCents, 0);
  assert.equal(orderSummary([canceled]).completedCents, 0);
});
test("transições preservam originais e estados finais não reabrem", () => {
  const next = changeOrderStatus(initialOrders, "demo-2", "Em_Andamento");
  assert.equal(initialOrders[1].status, "Pendente");
  assert.equal(next[1].status, "Em_Andamento");
  assert.throws(() => changeOrderStatus(initialOrders, "demo-2", "Concluido"));
  assert.throws(() =>
    changeOrderStatus(initialOrders, "demo-3", "Em_Andamento"),
  );
  const canceled = changeOrderStatus(next, "demo-2", "Cancelado");
  assert.throws(() => changeOrderStatus(canceled, "demo-2", "Pendente"));
});
test("armazenamento vazio mantém [] e corrupção não vira exemplos silenciosamente", () => {
  assert.deepEqual(parseOrders("[]"), []);
  assert.equal(parseOrders(null).length, 3);
  assert.throws(() => parseOrders("bad"));
  assert.throws(() => parseOrders("{}"));
  assert.throws(() =>
    parseOrders(JSON.stringify([initialOrders[0], initialOrders[0]])),
  );
  assert.throws(() =>
    parseOrders(JSON.stringify([{ ...initialOrders[0], items: [] }])),
  );
});
test("validação rejeita quantidades fracionárias, dinheiro inválido e contatos malformados", () => {
  const valid = structuredClone(initialOrders[0]);
  assert.ok(validateOrder(valid));
  for (const override of [
    { quantity: 0 },
    { quantity: 1.5 },
    { unitPrice: -1 },
    { unitPrice: 1.001 },
    { unitPrice: Infinity },
    { description: "" },
  ]) {
    assert.equal(
      validateOrder({ ...valid, items: [{ ...valid.items[0], ...override }] }),
      false,
    );
  }
  assert.equal(
    validateOrder({
      ...valid,
      customer: { ...valid.customer, email: "sem-email" },
    }),
    false,
  );
  assert.equal(validateOrder({ ...valid, createdAt: "ontem" }), false);
});
test("busca por protocolo, cliente e status sem alterar o array original", () => {
  assert.deepEqual(
    filterOrders(initialOrders, "20261006-002", "Todos").map((o) => o.id),
    ["demo-2"],
  );
  assert.equal(filterOrders(initialOrders, "studio", "Concluido").length, 1);
  assert.equal(filterOrders(initialOrders, "studio", "Pendente").length, 0);
  assert.equal(initialOrders[0].id, "demo-1");
});
test("requisição cancelada não lê dados e recarga usa registros persistidos", async () => {
  const c = new AbortController();
  const promise = fetchOrders(c.signal);
  c.abort();
  await assert.rejects(promise, { name: "AbortError" });
  const saved = JSON.stringify(
    changeOrderStatus(initialOrders, "demo-2", "Em_Andamento"),
  );
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => {
        assert.equal(key, KEY);
        return saved;
      },
    },
  });
  const result = await fetchOrders();
  assert.equal(result[1].status, "Em_Andamento");
  assert.equal(result.length, 3);
  delete (globalThis as { localStorage?: unknown }).localStorage;
});
