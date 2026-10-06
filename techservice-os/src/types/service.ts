export interface Customer {
  name: string;
  phone: string;
  email: string;
}
export interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}
export type ServiceStatus =
  | "Pendente"
  | "Em_Andamento"
  | "Concluido"
  | "Cancelado";
export interface OrderService {
  id: string;
  protocol: string;
  customer: Customer;
  items: ServiceItem[];
  status: ServiceStatus;
  createdAt: string;
  notes?: string;
}
export const statusLabels: Record<ServiceStatus, string> = {
  Pendente: "Pendente",
  Em_Andamento: "Em andamento",
  Concluido: "Concluído",
  Cancelado: "Cancelado",
};
