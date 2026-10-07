import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateNodeRules,
  evaluateCondition,
  executeFlow,
  validateFlow,
  validatePayload,
  parseFlowJson,
} from "../src/lib/automationNodeEngine";
import type { AutomationFlow } from "../src/lib/automationNodeEngine";
import {
  exampleFlow,
  examplePayload,
  samplePayloads,
} from "../src/lib/examples";
test("ALL and ANY use strict comparisons without coercion", () => {
  const node = {
    id: "one",
    matchType: "ALL" as const,
    conditions: [
      { field: "total", operator: "greaterThan" as const, value: 500 },
      { field: "status", operator: "equals" as const, value: "pago" },
    ],
    actionToTrigger: "ACTION",
  };
  assert.equal(evaluateNodeRules(examplePayload, node), true);
  assert.equal(
    evaluateNodeRules({ ...examplePayload, total: "750" }, node),
    false,
  );
  assert.equal(
    evaluateNodeRules(
      { ...examplePayload, status: "pendente" },
      { ...node, matchType: "ANY" },
    ),
    true,
  );
  assert.equal(
    evaluateNodeRules(examplePayload, { ...node, conditions: [] }),
    false,
  );
});
test("contains is case insensitive, missing and inherited fields never match", () => {
  assert.equal(
    evaluateCondition(
      { origin: "SITE institucional" },
      { field: "origin", operator: "contains", value: "site" },
    ),
    true,
  );
  assert.equal(
    evaluateCondition(Object.create({ total: 700 }), {
      field: "total",
      operator: "greaterThan",
      value: 500,
    }),
    false,
  );
  assert.equal(
    evaluateCondition({}, { field: "status", operator: "equals", value: null }),
    false,
  );
  assert.equal(
    evaluateCondition(
      { status: null },
      { field: "status", operator: "equals", value: null },
    ),
    true,
  );
});
test("branch choices produce expected ordered actions and traces", () => {
  const r = executeFlow(examplePayload, exampleFlow);
  assert.deepEqual(
    r.trace.map((t) => t.nodeId),
    ["qualificar", "prioridade", "finalizar"],
  );
  assert.deepEqual(r.actions, [
    "CLASSIFICAR_PRIORIDADE",
    "REGISTRAR_ATENDIMENTO_PRIORITARIO",
    "FINALIZAR_SIMULACAO",
  ]);
  assert.deepEqual(
    executeFlow(samplePayloads[1].value, exampleFlow).trace.map(
      (t) => t.nodeId,
    ),
    ["qualificar", "triagem", "contato", "finalizar"],
  );
  assert.deepEqual(
    executeFlow(samplePayloads[2].value, exampleFlow).trace.map(
      (t) => t.nodeId,
    ),
    ["qualificar", "triagem", "revisao", "finalizar"],
  );
});
test("cycles and dangling edges fail before any execution", () => {
  const cyclic = structuredClone(exampleFlow);
  (cyclic.nodes.at(-1)! as { next: string[] }).next = ["qualificar"];
  assert.throws(() => executeFlow(examplePayload, cyclic), /Ciclo/);
  const missing = structuredClone(exampleFlow);
  (missing.nodes.at(-1)! as { next: string[] }).next = ["missing"];
  assert.throws(() => validateFlow(missing), /inexistente/);
});
test("duplicate IDs, missing entry, unknown node properties and disconnected nodes fail", () => {
  assert.throws(() =>
    validateFlow({
      ...exampleFlow,
      nodes: [...exampleFlow.nodes, exampleFlow.nodes[0]],
    }),
  );
  assert.throws(() => validateFlow({ ...exampleFlow, entryId: "missing" }));
  assert.throws(() =>
    validateFlow({
      ...exampleFlow,
      nodes: [
        { ...exampleFlow.nodes[0], javascript: "alert(1)" },
        ...exampleFlow.nodes.slice(1),
      ],
    }),
  );
  assert.throws(
    () =>
      validateFlow({
        ...exampleFlow,
        nodes: [
          ...exampleFlow.nodes,
          {
            id: "detached",
            kind: "action",
            actionToTrigger: "OTHER",
            next: [],
          },
        ],
      }),
    /desconectados/,
  );
});
test("invalid operators and numeric string rules are rejected even in an unselected branch", () => {
  const flow = structuredClone(exampleFlow);
  if (flow.nodes[2].kind === "condition")
    (flow.nodes[2].conditions[0] as unknown as { operator: string }).operator =
      "eval";
  assert.throws(() => executeFlow(examplePayload, flow));
  assert.throws(() =>
    evaluateCondition(
      { total: 700 },
      { field: "total", operator: "greaterThan", value: "500" },
    ),
  );
});
test("diamond convergence executes each node only once in deterministic DFS order", () => {
  const flow: AutomationFlow = {
    entryId: "start",
    nodes: [
      {
        id: "start",
        kind: "action",
        actionToTrigger: "START",
        next: ["left", "right"],
      },
      { id: "left", kind: "action", actionToTrigger: "LEFT", next: ["end"] },
      { id: "right", kind: "action", actionToTrigger: "RIGHT", next: ["end"] },
      { id: "end", kind: "action", actionToTrigger: "END", next: [] },
    ],
  };
  const r = executeFlow({}, flow);
  assert.deepEqual(r.actions, ["START", "LEFT", "END", "RIGHT"]);
  assert.equal(r.trace.filter((t) => t.nodeId === "end").length, 1);
});
test("input objects and graph definitions remain unchanged", () => {
  const before = JSON.stringify(exampleFlow);
  const output = executeFlow(examplePayload, exampleFlow);
  output.trace[0].next.push("modified");
  assert.equal(JSON.stringify(exampleFlow), before);
  assert.equal(examplePayload.total, 750);
});
test("bounded JSON and payloads reject unsafe keys, nested values and nonfinite numbers", () => {
  assert.throws(() => parseFlowJson("{"));
  assert.throws(() => parseFlowJson(" ".repeat(30001)));
  assert.throws(() => validatePayload(JSON.parse('{"__proto__":true}')));
  assert.throws(() => validatePayload({ total: Infinity }));
  assert.throws(() => validatePayload({ customer: { name: "x" } }));
  assert.throws(() =>
    validateFlow({
      ...exampleFlow,
      nodes: Array(51).fill(exampleFlow.nodes[0]),
    }),
  );
});
