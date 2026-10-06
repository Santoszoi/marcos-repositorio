import type { AdCampaign, CampaignFilters } from "@/types/analytics";
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n,
  );
export const number = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
export const percent = (n: number) =>
  `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
export function filterCampaigns(data: AdCampaign[], f: CampaignFilters) {
  return data.filter(
    (c) =>
      (f.platform === "Todas" || c.platform === f.platform) &&
      (f.status === "Todos" || c.status === f.status) &&
      c.name
        .toLocaleLowerCase("pt-BR")
        .includes(f.search.toLocaleLowerCase("pt-BR").trim()),
  );
}
export function summary(data: AdCampaign[]) {
  const spent = data.reduce((s, c) => s + Math.round(c.spent * 100), 0) / 100;
  const impressions = data.reduce((s, c) => s + c.impressions, 0);
  const clicks = data.reduce((s, c) => s + c.clicks, 0);
  const conversions = data.reduce((s, c) => s + c.conversions, 0);
  return {
    spent,
    impressions,
    clicks,
    conversions,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    cpc: clicks ? spent / clicks : 0,
    cpa: conversions ? spent / conversions : 0,
  };
}
export function restoreStatuses(raw: string | null) {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data))
      return {};
    const result: Record<string, "Ativa" | "Pausada"> = {};
    for (const [k, v] of Object.entries(data)) {
      if (
        ["1", "2", "3", "5"].includes(k) &&
        (v === "Ativa" || v === "Pausada")
      )
        result[k] = v;
    }
    return result;
  } catch {
    return {};
  }
}
