"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { AdCampaign, DailyMetrics } from "@/types/analytics";
import { fetchDailyMetrics } from "@/lib/mockApi";
import { money } from "@/lib/analytics";
export default function PerformanceChart({
  campaigns,
}: {
  campaigns: AdCampaign[];
}) {
  const [data, setData] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError("");
    fetchDailyMetrics(campaigns, c.signal)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError("Não foi possível carregar o gráfico.");
          setLoading(false);
        }
      });
    return () => c.abort();
  }, [campaigns]);
  return (
    <section className="panel chart-panel" aria-busy={loading}>
      <div className="panel-header">
        <div>
          <h2>Investimento e retorno</h2>
          <p>Receita atribuída simulada · 01 a 06 de outubro de 2026</p>
        </div>
        <div className="legend">
          <span className="legend-lime">Receita</span>
          <span className="legend-purple">Investimento</span>
        </div>
      </div>
      {loading ? (
        <div className="chart-skeleton skeleton" role="status">
          Carregando gráfico…
        </div>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : campaigns.length === 0 ? (
        <div className="empty">Nenhuma campanha neste filtro.</div>
      ) : (
        <>
          <div
            className="chart"
            role="img"
            aria-label="Evolução diária de investimento e receita simulada. Dados disponíveis na tabela a seguir."
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 15, right: 15, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b9f46b" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#b9f46b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a694ff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#a694ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#29323a"
                  strokeDasharray="4 5"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  stroke="#abb4bf"
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(v) => `R$ ${Number(v) / 1000} mil`}
                  tickLine={false}
                  axisLine={false}
                  stroke="#abb4bf"
                  width={76}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(v) => money(Number(v))}
                  contentStyle={{
                    background: "#182127",
                    border: "1px solid #3c4853",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  name="Receita simulada"
                  dataKey="retorno"
                  stroke="#b9f46b"
                  fill="url(#revenue)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  name="Investimento"
                  dataKey="investimento"
                  stroke="#a694ff"
                  fill="url(#investment)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <details className="chart-data">
            <summary>Consultar dados do gráfico</summary>
            <table>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Investimento</th>
                  <th>Receita simulada</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{money(d.investimento)}</td>
                    <td>{money(d.retorno)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
