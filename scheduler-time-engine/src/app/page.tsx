"use client";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock3,
  ShieldCheck,
  Trash2,
  FlaskConical,
} from "lucide-react";
import Shell from "@/components/EngineShell";
import {
  SchedulerEngine,
  SchedulingConflictError,
  parseDemoDateTime,
  findSchedulingConflicts,
  sortAndGroupSlots,
} from "@/lib/schedulerEngine";
import type { TimeSlot, SlotInput } from "@/lib/schedulerEngine";
import { exampleSlots, resources } from "@/lib/examples";
import { registerReadTool } from "@/lib/webmcp";
const format = (date: Date) =>
  date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
export default function Scheduler() {
  const engine = useRef<SchedulerEngine | null>(null);
  if (!engine.current) engine.current = new SchedulerEngine(exampleSlots);
  const [slots, setSlots] = useState<TimeSlot[]>(exampleSlots);
  const [resource, setResource] = useState("sala-a");
  const [title, setTitle] = useState("Reunião de alinhamento");
  const [start, setStart] = useState("2026-10-07T10:00");
  const [end, setEnd] = useState("2026-10-07T11:00");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<{
    type: "ok" | "error" | "race";
    message: string;
    lines: string[];
  } | null>(null);
  const [day, setDay] = useState("2026-10-07");
  const working = useRef(false);
  function draft(): SlotInput {
    return {
      resourceId: resource,
      title: title.trim(),
      startTime: parseDemoDateTime(start),
      endTime: parseDemoDateTime(end),
    };
  }
  async function reserve(race = false) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setNotice("");
    setResult(null);
    try {
      const input = draft();
      if (race) {
        const attempts = await Promise.allSettled([
          engine.current!.reserve(input),
          engine.current!.reserve({
            ...input,
            title: input.title + " · solicitação B",
          }),
        ]);
        const successes = attempts.filter(
          (r) => r.status === "fulfilled",
        ).length;
        setResult({
          type: "race",
          message: `${successes} reserva confirmada · ${2 - successes} solicitação rejeitada`,
          lines: attempts.map(
            (r, i) =>
              `Solicitação ${i === 0 ? "A" : "B"}: ${r.status === "fulfilled" ? "confirmada, sem duplicidade" : (r.reason as Error).message}`,
          ),
        });
      } else {
        await engine.current!.reserve(input);
        setResult({
          type: "ok",
          message: "Horário reservado com sucesso.",
          lines: [
            "O intervalo foi validado e inserido na mesma operação da engine.",
          ],
        });
      }
      setSlots(engine.current!.snapshot());
      setDay(start.slice(0, 10));
    } catch (e) {
      setResult({
        type: "error",
        message: (e as Error).message,
        lines:
          e instanceof SchedulingConflictError
            ? engine
                .current!.snapshot()
                .filter((s) => e.conflictIds.includes(s.id))
                .map(
                  (s) =>
                    `${s.title}: ${format(s.startTime)} – ${format(s.endTime)}`,
                )
            : [],
      });
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  function check() {
    try {
      const matches = findSchedulingConflicts(draft(), slots);
      setResult({
        type: matches.length ? "error" : "ok",
        message: matches.length
          ? "Este intervalo tem conflito."
          : "Intervalo disponível.",
        lines: matches.map(
          (s) => `${s.title}: ${format(s.startTime)} – ${format(s.endTime)}`,
        ),
      });
    } catch (e) {
      setResult({ type: "error", message: (e as Error).message, lines: [] });
    }
  }
  async function cancel(id: string) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await engine.current!.cancel(id);
      setSlots(engine.current!.snapshot());
      setNotice("Reserva removida.");
      setResult(null);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  function reset() {
    if (working.current) return;
    engine.current = new SchedulerEngine(exampleSlots);
    setSlots(engine.current.snapshot());
    setResult(null);
    setNotice("Exemplos restaurados.");
    setDay("2026-10-07");
  }
  let visible: TimeSlot[] = [];
  try {
    const from = parseDemoDateTime(day + "T00:00");
    const to = new Date(from.getTime() + 86400000);
    visible = slots.filter((s) => s.startTime < to && s.endTime > from);
  } catch {}
  const grouped = sortAndGroupSlots(visible);
  useEffect(
    () =>
      registerReadTool(
        "get_scheduler_summary",
        "Consultar reservas e resultado da última operação na demonstração.",
        () => ({
          reservationCount: slots.length,
          resourceCount: resources.length,
          result,
        }),
      ),
    [slots, result],
  );
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AGENDA / RECURSOS COMPARTILHADOS</p>
          <h1>Um horário. Uma reserva.</h1>
          <p>
            Explore conflitos, intervalos consecutivos e solicitações
            concorrentes.
          </p>
        </div>
        <button className="button secondary" disabled={busy} onClick={reset}>
          Restaurar exemplos
        </button>
      </div>
      <div className="metric-row">
        <div>
          <CalendarDays size={20} />
          <span>
            <strong>{slots.length}</strong> reservas na sessão
          </span>
        </div>
        <div>
          <Clock3 size={20} />
          <span>
            <strong>{resources.length}</strong> recursos disponíveis
          </span>
        </div>
        <div>
          <ShieldCheck size={20} />
          <span>
            Gravações <strong>serializadas</strong>
          </span>
        </div>
      </div>
      <div className="split scheduler-layout">
        <section className="panel form-panel">
          <div className="panel-title">
            <span className="step-marker">01</span>
            <div>
              <h2>Simular uma reserva</h2>
              <p>Horários com offset fixo UTC−03:00</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void reserve();
            }}
          >
            <label>
              Recurso
              <select
                value={resource}
                onChange={(e) => {
                  setResource(e.target.value);
                  setResult(null);
                }}
                disabled={busy}
              >
                {resources.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setResult(null);
                }}
                maxLength={160}
                disabled={busy}
              />
            </label>
            <label>
              Início
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setResult(null);
                }}
                min="2000-01-01T00:00"
                max="2100-12-31T23:59"
                disabled={busy}
              />
            </label>
            <label>
              Fim
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setResult(null);
                }}
                min="2000-01-01T00:00"
                max="2100-12-31T23:59"
                disabled={busy}
              />
            </label>
            <button
              className="button primary w-full"
              type="submit"
              disabled={busy}
            >
              <Plus size={17} />
              {busy ? "Processando…" : "Confirmar reserva"}
            </button>
            <button
              className="button secondary w-full"
              type="button"
              onClick={check}
              disabled={busy}
            >
              Verificar disponibilidade
            </button>
          </form>
          <div className="experiment">
            <FlaskConical size={19} />
            <h3>Teste de concorrência</h3>
            <p>
              Duas solicitações simultâneas disputam o mesmo intervalo. Se
              estiver livre, apenas uma será confirmada.
            </p>
            <button
              className="button subtle w-full"
              onClick={() => void reserve(true)}
              disabled={busy}
            >
              Executar disputa A × B
            </button>
          </div>
        </section>
        <div className="workspace-stack">
          <section className="panel schedule-panel">
            <div className="panel-title between">
              <div>
                <h2>Agenda dos recursos</h2>
                <p>Reservas de exemplo · dados nesta sessão</p>
              </div>
              <label className="compact-label">
                Data da agenda
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  min="2000-01-01"
                  max="2100-12-31"
                />
              </label>
            </div>
            <div className="resource-list">
              {resources.map((r, i) => (
                <div className="resource-group" key={r.id}>
                  <div className="resource-heading">
                    <span className={"resource-icon color-" + i}>
                      {r.name[0]}
                    </span>
                    <div>
                      <h3>{r.name}</h3>
                      <small>{r.description}</small>
                    </div>
                    <span className="count">{grouped[r.id]?.length ?? 0}</span>
                  </div>
                  <div className="reservation-list">
                    {grouped[r.id]?.length ? (
                      grouped[r.id].map((slot) => (
                        <div className={"reservation color-" + i} key={slot.id}>
                          <span className="time">
                            {format(slot.startTime)}
                            <small>até {format(slot.endTime)}</small>
                          </span>
                          <strong>{slot.title}</strong>
                          <button
                            className="icon-button"
                            aria-label={`Remover ${slot.title}`}
                            onClick={() => void cancel(slot.id)}
                            disabled={busy}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="resource-empty">
                        Nenhuma reserva neste dia.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section
            className={"result-panel " + (result?.type ?? "idle")}
            aria-live="polite"
          >
            <div className="result-heading">
              <h2>Resultado da engine</h2>
              <span>{result ? "Executado" : "Aguardando operação"}</span>
            </div>
            {result ? (
              <>
                <h3>{result.message}</h3>
                {result.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </>
            ) : (
              <p>
                Verifique um intervalo ou execute a disputa para ver como a
                engine responde.
              </p>
            )}
          </section>
          <p className="scope-note">
            Concorrência garantida por instância, em memória. Reservas não são
            compartilhadas entre pessoas ou mantidas após recarregar.
          </p>
        </div>
      </div>
      {notice && (
        <p className="feedback" role="status">
          {notice}
        </p>
      )}
    </Shell>
  );
}
