export type Platform = "Google Ads" | "Meta Ads" | "TikTok Ads";
export type CampaignStatus = "Ativa" | "Pausada" | "Concluída";
export interface AdCampaign {
  id: string;
  name: string;
  platform: Platform;
  status: CampaignStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
}
export interface DailyMetrics {
  date: string;
  investimento: number;
  retorno: number;
}
export type CampaignFilters = {
  platform: Platform | "Todas";
  status: CampaignStatus | "Todos";
  search: string;
};
