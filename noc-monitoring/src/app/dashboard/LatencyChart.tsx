"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TrafficHistory } from "@/types/network";

export default function LatencyChart({ data }: { data: TrafficHistory[] }) {
  const latest = data.at(-1);
  return (
    <section className="panel traffic-panel" aria-labelledby="traffic-title">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">INTERFACE WAN</div>
          <h2 id="traffic-title">Consumo de banda</h2>
        </div>
        <div className="traffic-values">
          <div>
            <span>
              <i className="cyan-dot" /> Download
            </span>
            <strong>
              {latest?.download ?? "—"} <small>Mbps</small>
            </strong>
          </div>
          <div>
            <span>
              <i className="blue-dot" /> Upload
            </span>
            <strong>
              {latest?.upload ?? "—"} <small>Mbps</small>
            </strong>
          </div>
        </div>
      </div>
      <div className="chart-container">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="download-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4cd6d3" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4cd6d3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="upload-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8db6ff" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8db6ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 6"
                stroke="#22313b"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#8196a4"
                fontSize={12}
                minTickGap={65}
                tickLine={false}
                axisLine={false}
                tickMargin={12}
              />
              <YAxis
                stroke="#8196a4"
                fontSize={12}
                domain={[0, 450]}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111f2a",
                  border: "1px solid #334653",
                  borderRadius: 8,
                  color: "#e5edf2",
                }}
                labelStyle={{ color: "#9cabb6" }}
                formatter={(value, name) => [`${value} Mbps`, name]}
              />
              <Area
                type="monotone"
                dataKey="download"
                name="Download"
                stroke="#4cd6d3"
                strokeWidth={2}
                fill="url(#download-fill)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="upload"
                name="Upload"
                stroke="#8db6ff"
                strokeWidth={2}
                fill="url(#upload-fill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-loading">
            Preparando histórico de demonstração…
          </div>
        )}
      </div>
      <div className="panel-foot">
        <span>Janela de 24 amostras · intervalos de 3 s</span>
        <span>Tráfego simulado em Mbps</span>
      </div>
    </section>
  );
}
