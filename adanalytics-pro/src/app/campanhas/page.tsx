"use client";
import { useMemo, useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { filterCampaigns, money, summary } from "@/lib/analytics";
import type { CampaignFilters } from "@/types/analytics";
import Filters from "@/components/Filters";
import CampaignTable from "@/components/CampaignTable";
import Loading from "@/components/Loading";
export default function Campaigns() {
  const { campaigns, loading, error, message, refresh, changeStatus } =
    useCampaigns();
  const [filter, setFilter] = useState<CampaignFilters>({
    platform: "Todas",
    status: "Todos",
    search: "",
  });
  const [sort, setSort] = useState("spent");
  const filtered = useMemo(
    () =>
      [...filterCampaigns(campaigns, filter)].sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name, "pt-BR")
          : sort === "cpa"
            ? a.cpa - b.cpa
            : b.spent - a.spent,
      ),
    [campaigns, filter, sort],
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PERFORMANCE / CAMPANHAS</p>
          <h1>Seu portfólio de campanhas.</h1>
          <p>Pesquise e compare os resultados de cada canal.</p>
        </div>
        <span className="demo-tag">Simulação interativa</span>
      </div>
      <div className="panel filter-panel">
        <Filters value={filter} onChange={setFilter} advanced />
        <label>
          Ordenar por
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="spent">Maior investimento</option>
            <option value="cpa">Menor CPA</option>
            <option value="name">Nome A–Z</option>
          </select>
        </label>
        <button
          className="button secondary"
          onClick={() => {
            setFilter({ platform: "Todas", status: "Todos", search: "" });
            setSort("spent");
          }}
        >
          Limpar filtros
        </button>
      </div>
      <p className="notice">
        Pausar ou ativar altera apenas esta demonstração e fica salvo neste
        navegador.
      </p>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <div role="alert" className="empty">
          {error}
          <button onClick={refresh} className="button">
            Tentar novamente
          </button>
        </div>
      ) : (
        <section className="panel">
          <div className="panel-header">
            <h2>{filtered.length} campanhas</h2>
            <span className="muted">
              Investimento: {money(summary(filtered).spent)}
            </span>
          </div>
          <CampaignTable campaigns={filtered} onStatusChange={changeStatus} />
        </section>
      )}
    </>
  );
}
