export type Primitive = string | number | boolean | null;
export interface RuleCondition {
  field: string;
  operator: "equals" | "greaterThan" | "lessThan" | "contains";
  value: Primitive;
}
export interface AutomationNode {
  id: string;
  matchType: "ALL" | "ANY";
  conditions: RuleCondition[];
  actionToTrigger: string;
}
export interface ConditionNode extends AutomationNode {
  kind: "condition";
  onMatch: string[];
  onMiss: string[];
}
export interface ActionNode {
  id: string;
  kind: "action";
  actionToTrigger: string;
  next: string[];
}
export type FlowNode = ConditionNode | ActionNode;
export interface AutomationFlow {
  entryId: string;
  nodes: FlowNode[];
}
export interface ExecutionTrace {
  nodeId: string;
  kind: FlowNode["kind"];
  matched?: boolean;
  action?: string;
  next: string[];
}
export interface FlowResult {
  actions: string[];
  trace: ExecutionTrace[];
  visitedNodes: number;
}
const operators = ["equals", "greaterThan", "lessThan", "contains"];
const blocked = new Set(["__proto__", "prototype", "constructor"]);
function primitive(value: unknown): value is Primitive {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}
function identifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(value) &&
    !blocked.has(value)
  );
}
function assertCondition(
  condition: unknown,
): asserts condition is RuleCondition {
  if (
    !record(condition) ||
    Object.keys(condition).some(
      (k) => !["field", "operator", "value"].includes(k),
    ) ||
    !identifier(condition.field) ||
    typeof condition.operator !== "string" ||
    !operators.includes(condition.operator) ||
    !primitive(condition.value)
  )
    throw new Error(
      "Condição inválida. Use campo simples, operador permitido e valor primitivo.",
    );
  if (
    ["greaterThan", "lessThan"].includes(condition.operator) &&
    typeof condition.value !== "number"
  )
    throw new Error(
      "Comparações numéricas exigem um número, sem conversão automática.",
    );
  if (condition.operator === "contains" && typeof condition.value !== "string")
    throw new Error("O operador contains exige texto.");
}
export function evaluateCondition(
  data: Readonly<Record<string, unknown>>,
  condition: RuleCondition,
): boolean {
  assertCondition(condition);
  if (!Object.hasOwn(data, condition.field)) return false;
  const value = data[condition.field];
  switch (condition.operator) {
    case "equals":
      return primitive(value) && value === condition.value;
    case "greaterThan":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > (condition.value as number)
      );
    case "lessThan":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value < (condition.value as number)
      );
    case "contains":
      return (
        typeof value === "string" &&
        value
          .toLocaleLowerCase("pt-BR")
          .includes((condition.value as string).toLocaleLowerCase("pt-BR"))
      );
  }
}
export function evaluateNodeRules(
  data: Readonly<Record<string, unknown>>,
  node: AutomationNode,
): boolean {
  if (
    !["ALL", "ANY"].includes(node.matchType) ||
    !Array.isArray(node.conditions) ||
    node.conditions.length > 20
  )
    throw new Error("Regra inválida.");
  node.conditions.forEach(assertCondition);
  if (!node.conditions.length) return false;
  return node.matchType === "ALL"
    ? node.conditions.every((c) => evaluateCondition(data, c))
    : node.conditions.some((c) => evaluateCondition(data, c));
}
export function validateFlow(value: unknown): AutomationFlow {
  if (
    !record(value) ||
    Object.keys(value).some((k) => !["entryId", "nodes"].includes(k)) ||
    !identifier(value.entryId) ||
    !Array.isArray(value.nodes) ||
    !value.nodes.length ||
    value.nodes.length > 50
  )
    throw new Error("O fluxo exige uma entrada e de 1 a 50 nós.");
  const ids = new Set<string>();
  for (const node of value.nodes) {
    if (
      !record(node) ||
      !identifier(node.id) ||
      ids.has(node.id) ||
      !identifier(node.actionToTrigger)
    )
      throw new Error("IDs e ações devem ser válidos e os IDs únicos.");
    ids.add(node.id);
    if (node.kind === "condition") {
      if (
        Object.keys(node).some(
          (k) =>
            ![
              "id",
              "kind",
              "matchType",
              "conditions",
              "actionToTrigger",
              "onMatch",
              "onMiss",
            ].includes(k),
        ) ||
        !["ALL", "ANY"].includes(String(node.matchType)) ||
        !Array.isArray(node.conditions) ||
        node.conditions.length > 20
      )
        throw new Error("Nó condicional inválido.");
      node.conditions.forEach(assertCondition);
    } else if (
      node.kind !== "action" ||
      Object.keys(node).some(
        (k) => !["id", "kind", "actionToTrigger", "next"].includes(k),
      )
    )
      throw new Error("Tipo de nó inválido.");
    for (const edgeList of node.kind === "condition"
      ? [node.onMatch, node.onMiss]
      : [node.next]) {
      if (
        !Array.isArray(edgeList) ||
        edgeList.length > 10 ||
        edgeList.some((id) => !identifier(id)) ||
        new Set(edgeList).size !== edgeList.length
      )
        throw new Error("Conexões inválidas.");
    }
  }
  if (!ids.has(value.entryId)) throw new Error("Nó de entrada não encontrado.");
  const flow = value as unknown as AutomationFlow;
  const index = new Map(flow.nodes.map((n) => [n.id, n]));
  const edges = (node: FlowNode) =>
    node.kind === "condition" ? [...node.onMatch, ...node.onMiss] : node.next;
  for (const node of flow.nodes)
    if (edges(node).some((id) => !ids.has(id)))
      throw new Error("Uma conexão aponta para um nó inexistente.");
  const colors = new Map<string, number>();
  function visit(id: string) {
    if (colors.get(id) === 1)
      throw new Error(
        "Ciclo detectado. Esta engine aceita somente fluxos sem ciclos.",
      );
    if (colors.get(id) === 2) return;
    colors.set(id, 1);
    for (const target of edges(index.get(id)!)) visit(target);
    colors.set(id, 2);
  }
  for (const node of flow.nodes) visit(node.id);
  const reachable = new Set<string>();
  function reach(id: string) {
    if (reachable.has(id)) return;
    reachable.add(id);
    edges(index.get(id)!).forEach(reach);
  }
  reach(flow.entryId);
  if (reachable.size !== flow.nodes.length)
    throw new Error("Há nós desconectados da entrada.");
  return structuredClone(flow);
}
export function validatePayload(value: unknown): Record<string, Primitive> {
  if (
    !record(value) ||
    Object.keys(value).length > 100 ||
    Object.entries(value).some(
      ([k, v]) =>
        !identifier(k) ||
        !primitive(v) ||
        (typeof v === "string" && v.length > 2000),
    )
  )
    throw new Error(
      "Os dados devem ser um objeto com até 100 campos simples e valores primitivos.",
    );
  return { ...value } as Record<string, Primitive>;
}
/** Deterministic depth-first traversal; each reachable node executes at most once. Actions are labels only. */
export function executeFlow(data: unknown, definition: unknown): FlowResult {
  const payload = validatePayload(data);
  const flow = validateFlow(definition);
  const index = new Map(flow.nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const trace: ExecutionTrace[] = [];
  const actions: string[] = [];
  const stack = [flow.entryId];
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = index.get(id)!;
    if (node.kind === "condition") {
      const matched = evaluateNodeRules(payload, node);
      const next = matched ? node.onMatch : node.onMiss;
      if (matched) actions.push(node.actionToTrigger);
      trace.push({
        nodeId: id,
        kind: node.kind,
        matched,
        ...(matched ? { action: node.actionToTrigger } : {}),
        next: [...next],
      });
      stack.push(...[...next].reverse());
    } else {
      actions.push(node.actionToTrigger);
      trace.push({
        nodeId: id,
        kind: node.kind,
        action: node.actionToTrigger,
        next: [...node.next],
      });
      stack.push(...[...node.next].reverse());
    }
  }
  return { actions, trace, visitedNodes: visited.size };
}
export function parseFlowJson(source: string): unknown {
  if (source.length > 30000)
    throw new Error("O JSON excede 30.000 caracteres.");
  try {
    return JSON.parse(source);
  } catch {
    throw new Error("JSON inválido. Confira a estrutura.");
  }
}
