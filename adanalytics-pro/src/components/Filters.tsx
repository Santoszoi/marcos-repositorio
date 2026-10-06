"use client";
import type {
  CampaignFilters,
  Platform,
  CampaignStatus,
} from "@/types/analytics";
export default function Filters({
  value,
  onChange,
  advanced = false,
}: {
  value: CampaignFilters;
  onChange: (f: CampaignFilters) => void;
  advanced?: boolean;
}) {
  return (
    <div className="filters">
      {advanced && (
        <label>
          Pesquisar campanha
          <input
            type="search"
            value={value.search}
            placeholder="Nome da campanha"
            onChange={(e) => onChange({ ...value, search: e.target.value })}
          />
        </label>
      )}
      <label>
        Plataforma
        <select
          value={value.platform}
          onChange={(e) =>
            onChange({
              ...value,
              platform: e.target.value as Platform | "Todas",
            })
          }
        >
          <option>Todas</option>
          <option>Google Ads</option>
          <option>Meta Ads</option>
          <option>TikTok Ads</option>
        </select>
      </label>
      {advanced && (
        <label>
          Status
          <select
            value={value.status}
            onChange={(e) =>
              onChange({
                ...value,
                status: e.target.value as CampaignStatus | "Todos",
              })
            }
          >
            <option>Todos</option>
            <option>Ativa</option>
            <option>Pausada</option>
            <option>Concluída</option>
          </select>
        </label>
      )}
    </div>
  );
}
