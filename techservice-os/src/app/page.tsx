"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ClipboardList,
  Clock3,
  Wallet,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useOrders } from "@/context/OrderContext";
import { money, orderSummary, filterOrders } from "@/lib/service";
import { statusLabels } from "@/types/service";
import OSCard from "@/components/OSCard";
import { registerReadTool } from "@/lib/webmcp";
export default function Dashboard() {
  const { orders, loading, error, message, changeStatus, reset, retry } =
    useOrders();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [confirm, setConfirm] = useState(false);
  const s = orderSummary(orders);
  const filtered = filterOrders(orders, search, status);
  useEffect(
    () =>
      registerReadTool(
        "get_service_summary",
        "Consultar totais de ordens de serviço deste navegador, sem dados de clientes.",
        () => ({ loading, error, ...orderSummary(orders) }),
      ),
    [orders, loading, error],
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CENTRAL DE OPERAÇÕES</p>
          <h1>Serviço organizado. Entrega no prazo.</h1>
          <p>
            Controle suas ordens, acompanhe a execução e planeje o faturamento.
          </p>
        </div>
        <Link className="button primary" href="/nova-os/">
          <Plus size={18} />
          Nova ordem de serviço
        </Link>
      </div>
      <div className="demo-banner">
        <span>
          <strong>Ambiente demonstrativo</strong> · Dados fictícios. Os
          registros ficam apenas neste navegador.
        </span>
        <button onClick={() => setConfirm(true)}>Restaurar exemplos</button>
      </div>
      {confirm && (
        <div className="confirm" role="alert">
          <span>
            Restaurar os exemplos apagará as O.S. criadas neste navegador.
          </span>
          <button
            className="button danger"
            onClick={() => {
              reset();
              setConfirm(false);
            }}
          >
            Restaurar
          </button>
          <button
            className="button secondary"
            onClick={() => setConfirm(false)}
          >
            Cancelar
          </button>
        </div>
      )}
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
      {loading ? (
        <div className="loading" role="status">
          <div className="metric-grid">
            {[1, 2, 3, 4].map((n) => (
              <div className="skeleton metric-skeleton" key={n} />
            ))}
          </div>
          <p>Carregando ordens de serviço…</p>
        </div>
      ) : error ? (
        <div className="error" role="alert">
          <p>{error}</p>
          <button className="button secondary" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric">
              <span className="metric-icon navy">
                <ClipboardList size={21} />
              </span>
              <div>
                <span>Total de O.S.</span>
                <strong>{s.total}</strong>
                <small>Todos os registros</small>
              </div>
            </div>
            <div className="metric">
              <span className="metric-icon blue">
                <Clock3 size={21} />
              </span>
              <div>
                <span>Em execução</span>
                <strong>{s.running}</strong>
                <small>Serviços em andamento</small>
              </div>
            </div>
            <div className="metric">
              <span className="metric-icon amber">
                <Wallet size={21} />
              </span>
              <div>
                <span>A faturar</span>
                <strong>{money(s.pendingCents / 100)}</strong>
                <small>Pendentes e em execução</small>
              </div>
            </div>
            <div className="metric">
              <span className="metric-icon green">
                <CheckCircle2 size={21} />
              </span>
              <div>
                <span>Serviços concluídos</span>
                <strong>{money(s.completedCents / 100)}</strong>
                <small>Valor das O.S. encerradas</small>
              </div>
            </div>
          </div>
          <section>
            <div className="section-heading">
              <div>
                <h2>Ordens de serviço</h2>
                <p>
                  {filtered.length}{" "}
                  {filtered.length === 1
                    ? "registro encontrado"
                    : "registros encontrados"}
                </p>
              </div>
              <div className="filters">
                <label className="search">
                  <span className="sr-only">Buscar cliente ou protocolo</span>
                  <Search size={17} />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cliente ou protocolo"
                  />
                </label>
                <label>
                  <span className="sr-only">Filtrar status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Todos">Todos os status</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="empty">
                <ClipboardList size={32} />
                <h3>Nenhuma O.S. encontrada</h3>
                <p>Ajuste a busca ou cadastre uma nova ordem.</p>
                <Link className="button primary" href="/nova-os/">
                  Nova ordem de serviço
                </Link>
              </div>
            ) : (
              <div className="orders-grid">
                {filtered.map((o) => (
                  <OSCard key={o.id} os={o} onStatusChange={changeStatus} />
                ))}
              </div>
            )}
          </section>
          <p className="financial-note">
            Valores de O.S. não representam pagamentos recebidos. Esta
            demonstração não emite nota fiscal.
          </p>
        </>
      )}
    </>
  );
}
