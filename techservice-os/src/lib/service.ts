import type { OrderService, ServiceItem, ServiceStatus } from "@/types/service";
export const KEY = "@techservice:os:v1";
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
export function totalCents(items: ServiceItem[]) {
  return items.reduce(
    (sum, i) => sum + Math.round(i.unitPrice * 100) * i.quantity,
    0,
  );
}
export const initialOrders: OrderService[] = [
  {
    id: "demo-1",
    protocol: "20261006-001",
    customer: {
      name: "Clínica Horizonte · Exemplo",
      phone: "(61) 90000-0001",
      email: "clinica@example.com",
    },
    items: [
      {
        id: "1a",
        description: "Configuração de rede e estações de trabalho",
        quantity: 1,
        unitPrice: 450,
      },
    ],
    status: "Em_Andamento",
    createdAt: "2026-10-06T12:00:00-03:00",
    notes: "Revisar os equipamentos da recepção. Dados fictícios.",
  },
  {
    id: "demo-2",
    protocol: "20261006-002",
    customer: {
      name: "Restaurante Sabor Local · Exemplo",
      phone: "(61) 90000-0002",
      email: "restaurante@example.com",
    },
    items: [
      {
        id: "2a",
        description: "Landing page institucional",
        quantity: 1,
        unitPrice: 1200,
      },
      {
        id: "2b",
        description: "Hospedagem e configuração de domínio",
        quantity: 1,
        unitPrice: 150,
      },
    ],
    status: "Pendente",
    createdAt: "2026-10-06T13:00:00-03:00",
    notes: "Cliente de demonstração.",
  },
  {
    id: "demo-3",
    protocol: "20261005-003",
    customer: {
      name: "Studio Criativo · Exemplo",
      phone: "(61) 90000-0003",
      email: "studio@example.com",
    },
    items: [
      {
        id: "3a",
        description: "Manutenção preventiva de computadores",
        quantity: 2,
        unitPrice: 180,
      },
    ],
    status: "Concluido",
    createdAt: "2026-10-05T14:00:00-03:00",
  },
];
const statuses: ServiceStatus[] = [
  "Pendente",
  "Em_Andamento",
  "Concluido",
  "Cancelado",
];
export const allowedTransitions: Record<ServiceStatus, ServiceStatus[]> = {
  Pendente: ["Em_Andamento", "Cancelado"],
  Em_Andamento: ["Concluido", "Cancelado"],
  Concluido: [],
  Cancelado: [],
};
export function changeOrderStatus(
  orders: OrderService[],
  id: string,
  status: ServiceStatus,
) {
  const order = orders.find((o) => o.id === id);
  if (!order || !allowedTransitions[order.status].includes(status))
    throw new Error("Mudança de status inválida.");
  return orders.map((o) => (o.id === id ? { ...o, status } : o));
}
export function validateOrder(value: unknown): value is OrderService {
  if (!value || typeof value !== "object") return false;
  const o = value as OrderService;
  if (
    typeof o.id !== "string" ||
    !o.id ||
    o.id.length > 100 ||
    typeof o.protocol !== "string" ||
    !o.protocol ||
    o.protocol.length > 100 ||
    !statuses.includes(o.status) ||
    typeof o.createdAt !== "string" ||
    !Number.isFinite(Date.parse(o.createdAt))
  )
    return false;
  if (
    !o.customer ||
    typeof o.customer.name !== "string" ||
    o.customer.name.trim().length < 2 ||
    o.customer.name.length > 120 ||
    typeof o.customer.phone !== "string" ||
    !/^\d{10,11}$/.test(o.customer.phone.replace(/\D/g, "")) ||
    typeof o.customer.email !== "string" ||
    o.customer.email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(o.customer.email)
  )
    return false;
  if (
    o.notes !== undefined &&
    (typeof o.notes !== "string" || o.notes.length > 1000)
  )
    return false;
  if (!Array.isArray(o.items) || o.items.length < 1 || o.items.length > 20)
    return false;
  const ids = new Set<string>();
  return o.items.every((i) => {
    if (
      !i ||
      typeof i.id !== "string" ||
      !i.id ||
      ids.has(i.id) ||
      typeof i.description !== "string" ||
      !i.description.trim() ||
      i.description.length > 200 ||
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 100 ||
      typeof i.unitPrice !== "number" ||
      !Number.isFinite(i.unitPrice) ||
      i.unitPrice < 0 ||
      i.unitPrice > 100000 ||
      Math.abs(i.unitPrice * 100 - Math.round(i.unitPrice * 100)) > 0.00001
    )
      return false;
    ids.add(i.id);
    return true;
  });
}
export function parseOrders(raw: string | null): OrderService[] {
  if (raw === null) return structuredClone(initialOrders);
  const data: unknown = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    data.length > 500 ||
    !data.every(validateOrder) ||
    new Set(data.map((o) => o.id)).size !== data.length ||
    new Set(data.map((o) => o.protocol)).size !== data.length
  )
    throw new Error(
      "Os registros salvos estão inválidos. Nenhum dado foi sobrescrito.",
    );
  return data;
}
export function orderSummary(orders: OrderService[]) {
  return {
    total: orders.length,
    running: orders.filter((o) => o.status === "Em_Andamento").length,
    pendingCents: orders
      .filter((o) => o.status === "Pendente" || o.status === "Em_Andamento")
      .reduce((s, o) => s + totalCents(o.items), 0),
    completedCents: orders
      .filter((o) => o.status === "Concluido")
      .reduce((s, o) => s + totalCents(o.items), 0),
  };
}
export function filterOrders(
  orders: OrderService[],
  search: string,
  status: string,
) {
  const text = search.trim().toLocaleLowerCase("pt-BR");
  return orders
    .filter(
      (o) =>
        (status === "Todos" || o.status === status) &&
        [o.protocol, o.customer.name, o.customer.email].some((v) =>
          v.toLocaleLowerCase("pt-BR").includes(text),
        ),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
