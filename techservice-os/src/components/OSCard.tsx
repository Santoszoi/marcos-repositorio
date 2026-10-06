"use client";
import { CalendarDays, Phone, Mail } from "lucide-react";
import type { OrderService, ServiceStatus } from "@/types/service";
import { statusLabels } from "@/types/service";
import { allowedTransitions, money, totalCents } from "@/lib/service";
export default function OSCard({
  os,
  onStatusChange,
}: {
  os: OrderService;
  onStatusChange: (id: string, status: ServiceStatus) => void;
}) {
  const allowed = allowedTransitions[os.status];
  return (
    <article className={"os-card status-" + os.status}>
      <div className="card-top">
        <span className="protocol">#{os.protocol}</span>
        <span className={"status " + os.status}>{statusLabels[os.status]}</span>
      </div>
      <h2>{os.customer.name}</h2>
      <div className="contact">
        <span>
          <Phone size={13} />
          {os.customer.phone}
        </span>
        <span>
          <Mail size={13} />
          {os.customer.email}
        </span>
      </div>
      <div className="items">
        <h3>Serviços</h3>
        {os.items.map((i) => (
          <div className="item" key={i.id}>
            <span>
              {i.quantity}× {i.description}
            </span>
            <strong>
              {money((Math.round(i.unitPrice * 100) * i.quantity) / 100)}
            </strong>
          </div>
        ))}
      </div>
      {os.notes && (
        <details className="notes">
          <summary>Observações</summary>
          <p>{os.notes}</p>
        </details>
      )}
      <div className="card-bottom">
        <div>
          <small>Valor da O.S.</small>
          <strong>{money(totalCents(os.items) / 100)}</strong>
        </div>
        {allowed.length > 0 ? (
          <label className="status-control">
            <span>Atualizar status</span>
            <select
              aria-label={`Status da O.S. ${os.protocol}`}
              value={os.status}
              onChange={(e) =>
                onStatusChange(os.id, e.target.value as ServiceStatus)
              }
            >
              <option value={os.status}>{statusLabels[os.status]}</option>
              {allowed.map((s) => (
                <option value={s} key={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="closed">Encerrada</span>
        )}
      </div>
      <div className="card-date">
        <CalendarDays size={13} />
        {new Date(os.createdAt).toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        })}
      </div>
    </article>
  );
}
