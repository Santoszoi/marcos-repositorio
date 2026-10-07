import type { AutomationFlow } from "./automationNodeEngine";
export const exampleFlow: AutomationFlow = {
  entryId: "qualificar",
  nodes: [
    {
      id: "qualificar",
      kind: "condition",
      matchType: "ALL",
      conditions: [
        { field: "total", operator: "greaterThan", value: 500 },
        { field: "status", operator: "equals", value: "pago" },
      ],
      actionToTrigger: "CLASSIFICAR_PRIORIDADE",
      onMatch: ["prioridade"],
      onMiss: ["triagem"],
    },
    {
      id: "prioridade",
      kind: "action",
      actionToTrigger: "REGISTRAR_ATENDIMENTO_PRIORITARIO",
      next: ["finalizar"],
    },
    {
      id: "triagem",
      kind: "condition",
      matchType: "ANY",
      conditions: [
        { field: "origem", operator: "contains", value: "site" },
        { field: "clienteRecorrente", operator: "equals", value: true },
      ],
      actionToTrigger: "CLASSIFICAR_CONTATO",
      onMatch: ["contato"],
      onMiss: ["revisao"],
    },
    {
      id: "contato",
      kind: "action",
      actionToTrigger: "REGISTRAR_ACOMPANHAMENTO",
      next: ["finalizar"],
    },
    {
      id: "revisao",
      kind: "action",
      actionToTrigger: "REGISTRAR_REVISAO_MANUAL",
      next: ["finalizar"],
    },
    {
      id: "finalizar",
      kind: "action",
      actionToTrigger: "FINALIZAR_SIMULACAO",
      next: [],
    },
  ],
};
export const examplePayload = {
  total: 750,
  status: "pago",
  origem: "site institucional",
  clienteRecorrente: false,
};
export const samplePayloads = [
  { name: "Pedido prioritário", value: examplePayload },
  {
    name: "Contato pelo site",
    value: {
      total: 150,
      status: "pendente",
      origem: "site institucional",
      clienteRecorrente: false,
    },
  },
  {
    name: "Revisão manual",
    value: {
      total: 150,
      status: "pendente",
      origem: "telefone",
      clienteRecorrente: false,
    },
  },
];
