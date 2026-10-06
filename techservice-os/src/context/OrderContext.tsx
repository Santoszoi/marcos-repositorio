"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { OrderService, ServiceStatus } from "@/types/service";
import {
  KEY,
  parseOrders,
  initialOrders,
  validateOrder,
  changeOrderStatus,
} from "@/lib/service";
import { fetchOrders } from "@/lib/mockApi";
const Context = createContext<{
  orders: OrderService[];
  loading: boolean;
  error: string;
  message: string;
  addOrder: (order: OrderService) => boolean;
  changeStatus: (id: string, status: ServiceStatus) => void;
  reset: () => void;
  retry: () => void;
} | null>(null);
export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError("");
    fetchOrders(c.signal)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(
            e instanceof SyntaxError
              ? "Não foi possível ler os registros salvos. Nenhum dado foi sobrescrito."
              : e.message || "Armazenamento indisponível.",
          );
          setLoading(false);
        }
      });
    const sync = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setOrders(parseOrders(e.newValue));
          setError("");
        } catch (e) {
          setError((e as Error).message);
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      c.abort();
      window.removeEventListener("storage", sync);
    };
  }, [revision]);
  function save(next: OrderService[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setOrders(next);
      setError("");
      return true;
    } catch {
      setMessage(
        "Não foi possível salvar. Verifique o armazenamento do navegador e tente novamente.",
      );
      return false;
    }
  }
  function addOrder(order: OrderService) {
    if (loading || error) {
      setMessage("Aguarde os registros serem carregados antes de salvar.");
      return false;
    }
    if (!validateOrder(order)) {
      setMessage("Revise os dados da ordem de serviço.");
      return false;
    }
    try {
      const current = parseOrders(localStorage.getItem(KEY));
      if (current.length >= 500) {
        setMessage("Limite de 500 ordens nesta demonstração.");
        return false;
      }
      if (
        current.some((o) => o.id === order.id || o.protocol === order.protocol)
      ) {
        setMessage("Este protocolo já existe.");
        return false;
      }
      if (save([order, ...current])) {
        setMessage(`O.S. ${order.protocol} criada com sucesso.`);
        return true;
      }
      return false;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    }
  }
  function changeStatus(id: string, status: ServiceStatus) {
    if (error || loading) return;
    try {
      const current = parseOrders(localStorage.getItem(KEY));
      const next = changeOrderStatus(current, id, status);
      if (save(next)) setMessage("Status atualizado.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <Context.Provider
      value={{
        orders,
        loading,
        error,
        message,
        addOrder,
        changeStatus,
        reset: () => {
          if (save(structuredClone(initialOrders)))
            setMessage("Demonstração restaurada.");
        },
        retry: () => setRevision((n) => n + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useOrders() {
  const c = useContext(Context);
  if (!c) throw new Error("OrderProvider ausente");
  return c;
}
