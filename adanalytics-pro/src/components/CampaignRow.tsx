"use client";
import { memo } from "react";
import type { AdCampaign, CampaignStatus } from "@/types/analytics";
import { money, number, percent } from "@/lib/analytics";
function Row({
  campaign: c,
  onStatusChange,
}: {
  campaign: AdCampaign;
  onStatusChange?: (id: string, status: CampaignStatus) => void;
}) {
  return (
    <tr>
      <td>
        <strong>{c.name}</strong>
        <small>
          {number(c.clicks)} cliques · {number(c.impressions)} impressões
        </small>
      </td>
      <td>
        <span
          className={
            "platform " +
            (c.platform === "Google Ads"
              ? "google"
              : c.platform === "Meta Ads"
                ? "meta"
                : "tiktok")
          }
        >
          {c.platform}
        </span>
      </td>
      <td>
        <span
          className={
            "status " +
            (c.status === "Ativa"
              ? "active"
              : c.status === "Pausada"
                ? "paused"
                : "finished")
          }
        >
          {c.status}
        </span>
      </td>
      <td className="numeric">{money(c.spent)}</td>
      <td className="numeric">{percent(c.ctr)}</td>
      <td className="numeric">{money(c.cpc)}</td>
      <td className="numeric">{money(c.cpa)}</td>
      {onStatusChange && (
        <td>
          {c.status === "Concluída" ? (
            <span className="muted">Encerrada</span>
          ) : (
            <button
              className="row-action"
              onClick={() =>
                onStatusChange(c.id, c.status === "Ativa" ? "Pausada" : "Ativa")
              }
              aria-label={`${c.status === "Ativa" ? "Pausar" : "Ativar"} ${c.name}`}
            >
              {c.status === "Ativa" ? "Pausar" : "Ativar"}
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
export default memo(Row);
