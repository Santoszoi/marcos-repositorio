"use client";
import { useEffect, useState } from "react";
import {
  Play,
  RotateCcw,
  GitBranch,
  Braces,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import Shell from "@/components/EngineShell";
import Canvas from "@/components/FlowCanvas";
import {
  executeFlow,
  validateFlow,
  parseFlowJson,
} from "@/lib/automationNodeEngine";
import type { AutomationFlow, FlowResult } from "@/lib/automationNodeEngine";
import { exampleFlow, examplePayload, samplePayloads } from "@/lib/examples";
import { registerReadTool } from "@/lib/webmcp";
export default function Automation() {
  const [flow, setFlow] = useState<AutomationFlow>(exampleFlow);
  const [definition, setDefinition] = useState(
    JSON.stringify(exampleFlow, null, 2),
  );
  const [payload, setPayload] = useState(
    JSON.stringify(examplePayload, null, 2),
  );
  const [result, setResult] = useState<FlowResult | null>(null);
  const [error, setError] = useState("");
  const [graphError, setGraphError] = useState("");
  const [mode, setMode] = useState<"canvas" | "json">("canvas");
  const [duration, setDuration] = useState(0);
  const [applied, setApplied] = useState(false);
  const [scenario, setScenario] = useState("0");
  const [dirty, setDirty] = useState(false);
  function run() {
    setError("");
    setApplied(false);
    const started = performance.now();
    try {
      const validated = validateFlow(parseFlowJson(definition));
      const output = executeFlow(parseFlowJson(payload), validated);
      setFlow(validated);
      setResult(output);
      setDuration(performance.now() - started);
      setDirty(false);
      setGraphError("");
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    }
  }
  function apply() {
    setGraphError("");
    setError("");
    setApplied(false);
    try {
      const validated = validateFlow(parseFlowJson(definition));
      setFlow(validated);
      setResult(null);
      setDirty(false);
      setApplied(true);
    } catch (e) {
      setGraphError((e as Error).message);
    }
  }
  function reset() {
    setDefinition(JSON.stringify(exampleFlow, null, 2));
    setFlow(exampleFlow);
    setPayload(JSON.stringify(examplePayload, null, 2));
    setResult(null);
    setError("");
    setGraphError("");
    setDirty(false);
    setApplied(false);
    setScenario("0");
  }
  useEffect(
    () =>
      registerReadTool(
        "get_automation_trace",
        "Consultar as ações simuladas e o caminho executado na demonstração.",
        () => ({
          actions: result?.actions ?? [],
          trace: result?.trace ?? [],
          error,
        }),
      ),
    [result, error],
  );
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AUTOMAÇÃO / EXECUÇÃO CONDICIONAL</p>
          <h1>Conecte regras. Entenda cada decisão.</h1>
          <p>
            Execute um fluxo JSON e acompanhe o caminho escolhido pela engine.
          </p>
        </div>
        <div className="heading-actions">
          <button className="button secondary" onClick={reset}>
            <RotateCcw size={16} />
            Restaurar
          </button>
          <button className="button primary" onClick={run}>
            <Play size={16} />
            Executar fluxo
          </button>
        </div>
      </div>
      <div className="automation-toolbar">
        <div>
          <GitBranch size={18} />
          <strong>{flow.nodes.length} nós</strong>
          <span>Fluxo sem ciclos · execução determinística</span>
        </div>
        <span className="demo-tag">Ações simuladas, sem envios externos</span>
      </div>
      <div className="automation-grid">
        <section className="panel payload-panel">
          <div className="panel-title">
            <Braces size={19} />
            <h2>Dados de entrada</h2>
          </div>
          <label>
            Cenário
            <select
              value={scenario}
              onChange={(e) => {
                const index = Number(e.target.value);
                setScenario(e.target.value);
                if (Number.isInteger(index) && samplePayloads[index]) {
                  setPayload(
                    JSON.stringify(samplePayloads[index].value, null, 2),
                  );
                  setResult(null);
                  setError("");
                }
              }}
            >
              <option value="" disabled>
                Selecionar exemplo
              </option>
              {samplePayloads.map((s, i) => (
                <option value={i} key={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="json-label">
            Payload JSON
            <textarea
              value={payload}
              maxLength={10000}
              spellCheck={false}
              rows={13}
              onChange={(e) => {
                setPayload(e.target.value);
                setScenario("");
                setResult(null);
                setError("");
              }}
            />
          </label>
          <p className="scope-note">
            Strings, números, booleanos e null. Nenhuma conversão automática.
          </p>
          <div className="operator-guide">
            <h3>Operadores</h3>
            <dl>
              <dt>equals</dt>
              <dd>Igualdade de valor e tipo</dd>
              <dt>greaterThan / lessThan</dt>
              <dd>Comparação entre números</dd>
              <dt>contains</dt>
              <dd>Texto, sem diferenciar maiúsculas</dd>
            </dl>
          </div>
        </section>
        <section className="panel graph-panel">
          <div className="panel-title between">
            <h2>Definição do fluxo</h2>
            <div className="segmented">
              <button
                className={mode === "canvas" ? "selected" : ""}
                aria-pressed={mode === "canvas"}
                onClick={() => setMode("canvas")}
              >
                Nós
              </button>
              <button
                className={mode === "json" ? "selected" : ""}
                aria-pressed={mode === "json"}
                onClick={() => setMode("json")}
              >
                Editar JSON
              </button>
            </div>
          </div>
          {dirty && (
            <p className="feedback">
              Há alterações ainda não aplicadas. A visualização mostra o último
              fluxo válido.
            </p>
          )}
          {mode === "canvas" ? (
            <Canvas flow={flow} result={result} />
          ) : (
            <div className="flow-editor">
              <label>
                Fluxo JSON
                <textarea
                  value={definition}
                  maxLength={30000}
                  rows={22}
                  spellCheck={false}
                  onChange={(e) => {
                    setDefinition(e.target.value);
                    setDirty(true);
                    setResult(null);
                    setApplied(false);
                    setGraphError("");
                    setError("");
                  }}
                />
              </label>
              <button className="button secondary" onClick={apply}>
                Validar e aplicar fluxo
              </button>
              {applied && (
                <p className="feedback" role="status">
                  Fluxo válido aplicado.
                </p>
              )}
              {graphError && (
                <p role="alert" className="error">
                  {graphError}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
      <section className="panel trace-panel" aria-live="polite">
        <div className="panel-title between">
          <div className="title-with-icon">
            <Terminal size={19} />
            <h2>Registro da execução</h2>
          </div>
          {result && (
            <span className="execution-time">
              {result.visitedNodes} nós visitados ·{" "}
              {duration.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
              ms
            </span>
          )}
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : result ? (
          <div className="trace-grid">
            <ol className="trace-list">
              {result.trace.map((t) => (
                <li key={t.nodeId}>
                  <span className="trace-icon">
                    <CheckCircle2 size={17} />
                  </span>
                  <div>
                    <strong>{t.nodeId}</strong>
                    <p>
                      {t.kind === "condition"
                        ? t.matched
                          ? "Ramo SIM selecionado"
                          : "Ramo NÃO selecionado"
                        : "Ação simulada registrada"}{" "}
                      ·{" "}
                      {t.next.length ? `Próximo: ${t.next.join(", ")}` : "fim"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="actions-output">
              <h3>Ações registradas</h3>
              {result.actions.map((a, i) => (
                <code key={i}>{a}</code>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-console">
            <Terminal size={23} />
            <p>
              Execute um cenário para inspecionar decisões e ações, na ordem em
              que ocorreram.
            </p>
          </div>
        )}
      </section>
      <p className="scope-note bottom-note">
        Esta engine interpreta condições e conexões de um grafo. Não executa
        JavaScript recebido, não envia mensagens e não acessa APIs.
      </p>
    </Shell>
  );
}
