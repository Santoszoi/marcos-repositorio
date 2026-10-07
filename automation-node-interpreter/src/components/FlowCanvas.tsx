import type { AutomationFlow, FlowResult } from "@/lib/automationNodeEngine";
import { GitBranch, Zap, Check } from "lucide-react";
export default function FlowCanvas({
  flow,
  result,
}: {
  flow: AutomationFlow;
  result: FlowResult | null;
}) {
  return (
    <div className="flow-canvas">
      <div className="flow-entry">ENTRADA · {flow.entryId}</div>
      <div className="flow-nodes">
        {flow.nodes.map((node) => {
          const trace = result?.trace.find((t) => t.nodeId === node.id);
          return (
            <article
              className={"flow-node " + node.kind + (trace ? " visited" : "")}
              key={node.id}
            >
              <div className="node-title">
                {node.kind === "condition" ? (
                  <GitBranch size={17} />
                ) : (
                  <Zap size={17} />
                )}
                <strong>{node.id}</strong>
                {trace && <Check size={17} />}
              </div>
              {node.kind === "condition" ? (
                <>
                  <span className="node-mode">
                    {node.matchType === "ALL"
                      ? "Todas as condições (AND)"
                      : "Uma ou mais condições (OR)"}
                  </span>
                  <ul>
                    {node.conditions.map((c, i) => (
                      <li key={i}>
                        <code>{c.field}</code>
                        <span>{c.operator}</span>
                        <code>{JSON.stringify(c.value)}</code>
                      </li>
                    ))}
                  </ul>
                  <div className="node-edges">
                    <span>SIM: {node.onMatch.join(", ") || "fim"}</span>
                    <span>NÃO: {node.onMiss.join(", ") || "fim"}</span>
                  </div>
                </>
              ) : (
                <>
                  <p>{node.actionToTrigger}</p>
                  <div className="node-edges">
                    <span>
                      Próximo: {node.next.join(", ") || "fim do fluxo"}
                    </span>
                  </div>
                </>
              )}
              {trace && (
                <div className="node-result">
                  {trace.kind === "condition"
                    ? trace.matched
                      ? "Condição atendida"
                      : "Condição não atendida"
                    : "Ação registrada"}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
