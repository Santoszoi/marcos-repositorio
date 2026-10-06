import type { AdCampaign, CampaignStatus } from "@/types/analytics";
import CampaignRow from "./CampaignRow";
export default function CampaignTable({
  campaigns,
  onStatusChange,
}: {
  campaigns: AdCampaign[];
  onStatusChange?: (id: string, status: CampaignStatus) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Plataforma</th>
            <th>Status</th>
            <th className="numeric">Investimento</th>
            <th className="numeric">CTR</th>
            <th className="numeric">CPC</th>
            <th className="numeric">CPA</th>
            {onStatusChange && <th>Ação</th>}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <CampaignRow
              key={c.id}
              campaign={c}
              onStatusChange={onStatusChange}
            />
          ))}
        </tbody>
      </table>
      {campaigns.length === 0 && (
        <p className="empty">Nenhuma campanha encontrada. Ajuste os filtros.</p>
      )}
    </div>
  );
}
