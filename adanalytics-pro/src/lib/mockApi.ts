import type { AdCampaign, DailyMetrics } from "@/types/analytics";
export const mockCampaigns: AdCampaign[] = [
  {
    id: "1",
    name: "Institucional · Marcos Solutions",
    platform: "Google Ads",
    status: "Ativa",
    budget: 50,
    spent: 1500,
    impressions: 45000,
    clicks: 3150,
    conversions: 180,
    ctr: 7,
    cpc: 0.47,
    cpa: 8.33,
  },
  {
    id: "2",
    name: "Conversão · E-commerce de Moda",
    platform: "Meta Ads",
    status: "Ativa",
    budget: 120,
    spent: 3400,
    impressions: 98000,
    clicks: 4120,
    conversions: 290,
    ctr: 4.2,
    cpc: 0.82,
    cpa: 11.72,
  },
  {
    id: "3",
    name: "Remarketing · Cesta de Compras",
    platform: "Meta Ads",
    status: "Pausada",
    budget: 30,
    spent: 450,
    impressions: 12000,
    clicks: 840,
    conversions: 65,
    ctr: 7,
    cpc: 0.53,
    cpa: 6.92,
  },
  {
    id: "4",
    name: "Institucional · Lead Generation",
    platform: "TikTok Ads",
    status: "Concluída",
    budget: 40,
    spent: 800,
    impressions: 55000,
    clicks: 1920,
    conversions: 42,
    ctr: 3.5,
    cpc: 0.41,
    cpa: 19.04,
  },
  {
    id: "5",
    name: "Pesquisa · Serviços de TI Local",
    platform: "Google Ads",
    status: "Ativa",
    budget: 60,
    spent: 1800,
    impressions: 22000,
    clicks: 1540,
    conversions: 95,
    ctr: 7,
    cpc: 1.16,
    cpa: 18.94,
  },
];
export function delay(signal?: AbortSignal, ms = 1200): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelado", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("Cancelado", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
export async function fetchCampaignsData(
  signal?: AbortSignal,
): Promise<AdCampaign[]> {
  await delay(signal);
  return mockCampaigns.map((c) => ({
    ...c,
    ctr: (c.clicks / c.impressions) * 100,
    cpc: c.spent / c.clicks,
    cpa: c.spent / c.conversions,
  }));
}
// Receita ilustrativa por campanha, independente da quantidade de conversões.
const returns: Record<string, number> = {
  "1": 4650,
  "2": 11220,
  "3": 1530,
  "4": 1600,
  "5": 5400,
};
const weights = [14, 17, 12, 21, 16, 20];
export function dailyMetrics(campaigns: AdCampaign[]): DailyMetrics[] {
  const spent = Math.round(campaigns.reduce((s, c) => s + c.spent, 0) * 100);
  const revenue = Math.round(
    campaigns.reduce((s, c) => s + (returns[c.id] ?? 0), 0) * 100,
  );
  let allocatedSpend = 0,
    allocatedRevenue = 0;
  return weights.map((weight, i) => {
    const s =
      i === 5 ? spent - allocatedSpend : Math.round((spent * weight) / 100);
    const r =
      i === 5
        ? revenue - allocatedRevenue
        : Math.round((revenue * weight) / 100);
    allocatedSpend += s;
    allocatedRevenue += r;
    return { date: `0${i + 1}/10`, investimento: s / 100, retorno: r / 100 };
  });
}
export async function fetchDailyMetrics(
  campaigns: AdCampaign[],
  signal?: AbortSignal,
) {
  await delay(signal, 350);
  return dailyMetrics(campaigns);
}
