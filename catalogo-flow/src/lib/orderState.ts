import type { OrderStatus } from "@/types/store";
export const statusLabels: Record<OrderStatus, string> = {
  new: "Novo",
  preparing: "Em preparo",
  ready: "Pronto",
  completed: "Concluído",
  cancelled: "Cancelado",
};
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
