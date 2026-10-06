"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Wallet,
  MousePointerClick,
  Target,
  TrendingUp,
} from "lucide-react";
import { useCampaigns } from "@/context/CampaignContext";
import {
  filterCampaigns,
  summary,
  money,
  number,
  percent,
} from "@/lib/analytics";
import { dailyMetrics } from "@/lib/mockApi";
import type { CampaignFilters } from "@/types/analytics";
import dynamic from "next/dynamic";
const PerformanceChart = dynamic(
  () => import("@/components/PerformanceChart"),
  {
    ssr: false,
    loading: () => (
      <div className="panel chart-skeleton skeleton" role="status">
        Carregando gráfico…
      </div>
    ),
  },
);
import CampaignTable from "@/components/CampaignTable";
import Filters from "@/components/Filters";
import Loading from "@/components/Loading";
import { registerReadTool } from "@/lib/webmcp";
export default function Dashboard() {
  const { campaigns, loading, error, message, refresh } = useCampaigns();
  const [filter, setFilter] = useState<CampaignFilters>({
    platform: "Todas",
    status: "Todos",
    search: "",
  });
  const filtered = useMemo(
    () => filterCampaigns(campaigns, filter),
    [campaigns, filter],
  );
  const s = summary(filtered);
  const revenue = dailyMetrics(filtered).reduce((a, d) => a + d.retorno, 0);
  const roas = s.spent ? revenue / s.spent : 0;
  useEffect(
    () =>
      registerReadTool(
        "get_campaign_summary",
        "Consultar indicadores das campanhas no filtro atual. Dados simulados.",
        () => ({
          loading,
          error,
          platform: filter.platform,
          ...summary(filtered),
        }),
      ),
    [loading, error, filter.platform, filtered],
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PERFORMANCE / VISÃO GERAL</p>
          <h1>Decisões começam com dados.</h1>
          <p>Acompanhe investimento, conversões e eficiência das campanhas.</p>
        </div>
        <button
          className="button secondary"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>
      <div className="toolbar">
        <span className="period">
          01 – 06 outubro, 2026 <small>Período demonstrativo fixo</small>
        </span>
        <Filters value={filter} onChange={setFilter} />
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="empty" role="alert">
          {error}
          <button className="button" onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric">
              <div>
                <span>Investimento total</span>
                <Wallet size={18} />
              </div>
              <strong>{money(s.spent)}</strong>
              <small>{filtered.length} campanhas no filtro</small>
            </div>
            <div className="metric">
              <div>
                <span>Conversões</span>
                <Target size={18} />
              </div>
              <strong>{number(s.conversions)}</strong>
              <small>CPA {money(s.cpa)}</small>
            </div>
            <div className="metric">
              <div>
                <span>CTR consolidado</span>
                <MousePointerClick size={18} />
              </div>
              <strong>{percent(s.ctr)}</strong>
              <small>{number(s.clicks)} cliques no período</small>
            </div>
            <div className="metric accent">
              <div>
                <span>ROAS simulado</span>
                <TrendingUp size={18} />
              </div>
              <strong>
                {roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x
              </strong>
              <small>Receita ÷ investimento</small>
            </div>
          </div>
          <div className="chart-grid">
            <PerformanceChart campaigns={filtered} />
            <section className="panel channels">
              <div className="panel-header">
                <div>
                  <h2>Mix de investimento</h2>
                  <p>Distribuição por plataforma</p>
                </div>
              </div>
              {(["Google Ads", "Meta Ads", "TikTok Ads"] as const).map(
                (p, i) => {
                  const spend = filtered
                    .filter((c) => c.platform === p)
                    .reduce((a, c) => a + c.spent, 0);
                  const share = s.spent ? (spend / s.spent) * 100 : 0;
                  return (
                    <div className="channel" key={p}>
                      <div>
                        <span>
                          <b className={"channel-icon c" + i}>{p[0]}</b>
                          {p}
                        </span>
                        <strong>{money(spend)}</strong>
                      </div>
                      <div className="track">
                        <span
                          className={"c" + i}
                          style={{ width: share + "%" }}
                        />
                      </div>
                      <small>{percent(share)} do investimento</small>
                    </div>
                  );
                },
              )}
              <div className="channel-note">
                Os valores são fictícios e não representam resultados de contas
                reais.
              </div>
            </section>
          </div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Campanhas no período</h2>
                <p>{filtered.length} resultados · Valores em reais</p>
              </div>
              <Link className="text-link" href="/campanhas/">
                Gerenciar campanhas
              </Link>
            </div>
            <CampaignTable campaigns={filtered} />
          </section>
        </>
      )}
    </>
  );
}
