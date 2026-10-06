"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  CircleCheck,
  TriangleAlert,
  Timer,
  Pause,
  Play,
  RotateCcw,
  Radio,
} from "lucide-react";
import Brand from "@/components/Brand";
import {
  initialDevices,
  generateTrafficHistory,
  updateLiveMetrics,
  makeTrafficSample,
  appendTraffic,
  getSummary,
  INTERVAL_MS,
} from "@/lib/mockData";
import type { TrafficHistory } from "@/types/network";
import LatencyChart from "./LatencyChart";
import DeviceStatus from "./DeviceStatus";

export default function NOCDashboard() {
  const [devices, setDevices] = useState(initialDevices);
  const [traffic, setTraffic] = useState<TrafficHistory[]>([]);
  const [paused, setPaused] = useState(false);
  const [updated, setUpdated] = useState("—");
  const summary = getSummary(devices);
  const warningCount = devices.filter((d) => d.status === "Warning").length;
  const stateRef = useRef({ summary, paused });
  useEffect(() => {
    stateRef.current = { summary, paused };
  }, [summary, paused]);

  useEffect(() => {
    const now = new Date();
    setTraffic(generateTrafficHistory(now));
    setUpdated(now.toLocaleTimeString("pt-BR", { hour12: false }));
  }, []);
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const sample = makeTrafficSample();
      setDevices((previous) => updateLiveMetrics(previous));
      setTraffic((previous) => appendTraffic(previous, sample));
      setUpdated(sample.time);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [paused]);

  // Feature detection keeps the optional browser integration invisible in unsupported browsers.
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "get_noc_demo_summary",
            description:
              "Read the current simulated NOC metrics and whether the demonstration is paused.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input) {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Expected an empty object.");
              return {
                ...stateRef.current.summary,
                paused: stateRef.current.paused,
                simulated: true,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Unsupported implementations must not interrupt the demo. */
    }
    return () => lifecycle.abort();
  }, []);

  function reset() {
    const now = new Date();
    setDevices(initialDevices);
    setTraffic(generateTrafficHistory(now));
    setUpdated(now.toLocaleTimeString("pt-BR", { hour12: false }));
  }

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav aria-label="Navegação principal">
            <Link href="/">Vitrine do projeto</Link>
            <span className="demo-tag">AMBIENTE DE DEMONSTRAÇÃO</span>
          </nav>
        </div>
      </header>
      <main className="shell dashboard">
        <div className="dashboard-title">
          <div>
            <div className="eyebrow">VISÃO GERAL / REDE</div>
            <h1>
              Centro de operações<span className="cyan">.</span>
            </h1>
            <p className="muted">
              Saúde dos ativos, performance e tráfego em uma única visão.
            </p>
          </div>
          <div className={`stream-status ${paused ? "is-paused" : ""}`}>
            <span className="live-dot" />
            {paused ? "SIMULAÇÃO PAUSADA" : "TELEMETRIA SIMULADA"}
          </div>
        </div>
        <div className="demo-notice">
          <Radio size={18} />
          <span>
            Dados de demonstração. Nenhum equipamento real está conectado.
          </span>
        </div>
        <div className="kpi-grid">
          {[
            {
              Icon: Activity,
              label: "Dispositivos",
              value: summary.totalDevices.toString().padStart(2, "0"),
              note: "Inventário monitorado",
              tone: "neutral",
            },
            {
              Icon: CircleCheck,
              label: "Ativos saudáveis",
              value: summary.onlineDevices.toString().padStart(2, "0"),
              note: `${warningCount} em atenção`,
              tone: "green",
            },
            {
              Icon: TriangleAlert,
              label: "Falhas críticas",
              value: summary.criticalAlerts.toString().padStart(2, "0"),
              note: "Dispositivos indisponíveis",
              tone: "red",
            },
            {
              Icon: Timer,
              label: "Latência média",
              value: summary.averageLatency,
              unit: "ms",
              note: "Somente ativos disponíveis",
              tone: "cyan",
            },
          ].map(({ Icon, label, value, unit, note, tone }) => (
            <section className={`kpi ${tone}`} key={label}>
              <div className="kpi-top">
                <span>{label}</span>
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <div className="kpi-value mono">
                {value}
                {unit && <small>{unit}</small>}
              </div>
              <p>{note}</p>
            </section>
          ))}
        </div>
        <div className="telemetry-toolbar">
          <span className="muted">
            Última atualização <time className="mono">{updated}</time>
            <span className="toolbar-interval"> · a cada 3 s</span>
          </span>
          <div>
            <button
              className="button secondary small"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}{" "}
              {paused ? "Retomar" : "Pausar"}
            </button>
            <button className="button secondary small" onClick={reset}>
              <RotateCcw size={15} /> Reiniciar
            </button>
          </div>
        </div>
        <LatencyChart data={traffic} />
        <DeviceStatus devices={devices} />
        <div className="dashboard-bottom">
          <span>
            NOC Telemetry Center <span className="muted">/ Demo v1.0</span>
          </span>
          <span className="muted">Desenvolvido por Marcos Neves</span>
        </div>
      </main>
    </>
  );
}
