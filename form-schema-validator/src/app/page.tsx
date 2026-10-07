"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Code2,
  SlidersHorizontal,
  Play,
  ShieldCheck,
} from "lucide-react";
import Shell from "@/components/EngineShell";
import { validateSchema, parseJsonObject } from "@/lib/schemaValidator";
import type { ValidationResult } from "@/lib/schemaValidator";
import {
  buildRegistrationSchema,
  defaultOptions,
  validExample,
  invalidExample,
} from "@/lib/exampleSchema";
import type { RegistrationData } from "@/lib/exampleSchema";
import { registerReadTool } from "@/lib/webmcp";
const fieldNames: Record<keyof RegistrationData, string> = {
  name: "Nome",
  email: "E-mail",
  password: "Senha de exemplo",
  age: "Idade",
};
export default function Validator() {
  const [options, setOptions] = useState(defaultOptions);
  const [sample, setSample] = useState({ ...validExample });
  const [source, setSource] = useState(JSON.stringify(validExample, null, 2));
  const [mode, setMode] = useState<"form" | "json">("form");
  const [result, setResult] =
    useState<ValidationResult<RegistrationData> | null>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const schema = useMemo(() => buildRegistrationSchema(options), [options]);
  function invalidate() {
    setResult(null);
    setError("");
  }
  function validate() {
    setError("");
    const started = performance.now();
    try {
      const data = mode === "json" ? parseJsonObject(source) : sample;
      const output = validateSchema<RegistrationData>(data, schema);
      setResult(output);
      setDuration(performance.now() - started);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }
  function load(valid: boolean) {
    const data = valid ? validExample : invalidExample;
    setSample({ ...data });
    setSource(JSON.stringify(data, null, 2));
    invalidate();
  }
  useEffect(
    () =>
      registerReadTool(
        "get_validation_summary",
        "Consultar o resultado da validação, sem retornar valores de campos ou senha.",
        () => ({
          isValid: result?.isValid ?? null,
          errorCount: result ? Object.keys(result.errors).length : 0,
          unknownKeys: result?.unknownKeys ?? [],
          parseError: error,
        }),
      ),
    [result, error],
  );
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">VALIDAÇÃO / REGRAS COMPOSTAS</p>
          <h1>Dados certos, antes de seguir.</h1>
          <p>
            Configure o schema e teste entradas válidas, inválidas ou
            inesperadas.
          </p>
        </div>
        <span className="pill">
          <ShieldCheck size={16} />
          Sem bibliotecas de validação
        </span>
      </div>
      <div className="validator-top">
        <span>
          <b>01</b> Configure as regras
        </span>
        <span>
          <b>02</b> Preencha a entrada
        </span>
        <span>
          <b>03</b> Inspecione os erros
        </span>
      </div>
      <div className="validator-grid">
        <section className="panel rules-panel">
          <div className="panel-title">
            <SlidersHorizontal size={20} />
            <h2>Schema dinâmico</h2>
          </div>
          <div className="rule-block">
            <span className="field-key">
              name <small>string</small>
            </span>
            <p>Obrigatório · máximo de 120 caracteres</p>
            <label>
              Mínimo de caracteres
              <select
                value={options.nameMin}
                onChange={(e) => {
                  setOptions({ ...options, nameMin: Number(e.target.value) });
                  invalidate();
                }}
              >
                {[2, 3, 5, 10].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="rule-block">
            <span className="field-key">
              email <small>string</small>
            </span>
            <p>Obrigatório · máximo de 254 caracteres</p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.emailFormat}
                onChange={(e) => {
                  setOptions({ ...options, emailFormat: e.target.checked });
                  invalidate();
                }}
              />
              Validar formato de e-mail
            </label>
          </div>
          <div className="rule-block">
            <span className="field-key">
              password <small>string</small>
            </span>
            <label>
              Mínimo de caracteres
              <select
                value={options.passwordMin}
                onChange={(e) => {
                  setOptions({
                    ...options,
                    passwordMin: Number(e.target.value),
                  });
                  invalidate();
                }}
              >
                {[8, 12, 16, 20].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.passwordPolicy}
                onChange={(e) => {
                  setOptions({ ...options, passwordPolicy: e.target.checked });
                  invalidate();
                }}
              />
              Maiúscula, minúscula e número
            </label>
          </div>
          <div className="rule-block">
            <span className="field-key">
              age <small>number</small>
            </span>
            <p>Obrigatório · inteiro entre 18 e 120</p>
          </div>
          <div className="rule-footnote">
            Tipos são verificados sem conversão automática. Campos extras são
            rejeitados.
          </div>
        </section>
        <section className="panel input-panel">
          <div className="panel-title between">
            <h2>Entrada de dados</h2>
            <div className="segmented" aria-label="Formato de entrada">
              <button
                aria-pressed={mode === "form"}
                className={mode === "form" ? "selected" : ""}
                onClick={() => {
                  setMode("form");
                  invalidate();
                }}
              >
                Formulário
              </button>
              <button
                aria-pressed={mode === "json"}
                className={mode === "json" ? "selected" : ""}
                onClick={() => {
                  setMode("json");
                  invalidate();
                }}
              >
                JSON
              </button>
            </div>
          </div>
          <div className="sample-buttons">
            <button onClick={() => load(true)}>Exemplo válido</button>
            <button onClick={() => load(false)}>Exemplo inválido</button>
          </div>
          {mode === "form" ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                validate();
              }}
            >
              <div className="form-fields">
                {(["name", "email", "password", "age"] as const).map(
                  (field) => (
                    <label key={field}>
                      {fieldNames[field]}
                      <input
                        type={
                          field === "password"
                            ? "password"
                            : field === "age"
                              ? "number"
                              : field === "email"
                                ? "email"
                                : "text"
                        }
                        value={Number.isNaN(sample[field]) ? "" : sample[field]}
                        maxLength={
                          field === "password"
                            ? 72
                            : field === "email"
                              ? 254
                              : 120
                        }
                        aria-invalid={!!result?.errors[field]}
                        aria-describedby={
                          result?.errors[field] ? `error-${field}` : undefined
                        }
                        autoComplete="off"
                        onChange={(e) => {
                          setSample({
                            ...sample,
                            [field]:
                              field === "age"
                                ? e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value)
                                : e.target.value,
                          });
                          invalidate();
                        }}
                      />
                      {result?.errors[field] && (
                        <span className="field-error" id={`error-${field}`}>
                          {result.errors[field]}
                        </span>
                      )}
                    </label>
                  ),
                )}
              </div>
              <button className="button primary w-full" type="submit">
                <Play size={16} />
                Executar validação
              </button>
            </form>
          ) : (
            <>
              <label className="json-label">
                <span>
                  <Code2 size={16} />
                  Objeto de entrada
                </span>
                <textarea
                  value={source}
                  maxLength={10000}
                  rows={13}
                  spellCheck={false}
                  onChange={(e) => {
                    setSource(e.target.value);
                    invalidate();
                  }}
                />
              </label>
              <button className="button primary w-full" onClick={validate}>
                <Play size={16} />
                Validar JSON
              </button>
            </>
          )}
          <p className="scope-note">
            Use uma senha fictícia. Nenhum valor é enviado ou salvo no
            navegador.
          </p>
        </section>
        <section
          className={
            "panel validation-output " + (result?.isValid ? "valid" : "")
          }
          aria-live="polite"
        >
          <div className="panel-title">
            <h2>Resultado</h2>
            <span className="output-mark">OUTPUT</span>
          </div>
          {error ? (
            <div className="output-state error">
              <XCircle size={30} />
              <h3>Entrada não processada</h3>
              <p>{error}</p>
            </div>
          ) : result ? (
            <>
              <div
                className={
                  "output-state " + (result.isValid ? "valid" : "error")
                }
              >
                {result.isValid ? (
                  <CheckCircle2 size={32} />
                ) : (
                  <XCircle size={32} />
                )}
                <h3>
                  {result.isValid ? "Schema atendido" : "Revise os dados"}
                </h3>
                <p>
                  {result.isValid
                    ? "Todas as regras configuradas passaram."
                    : `${Object.keys(result.errors).length} campos com erro${result.formError ? " · erro estrutural" : ""}.`}
                </p>
              </div>
              <div className="output-details">
                {result.formError && (
                  <p className="field-error">{result.formError}</p>
                )}
                {Object.entries(result.errors).map(([field, message]) => (
                  <div className="validation-error" key={field}>
                    <code>{field}</code>
                    <p>{message}</p>
                  </div>
                ))}
                {!!result.unknownKeys.length && (
                  <p>Campos extras: {result.unknownKeys.join(", ")}</p>
                )}
                <div className="execution-time">
                  Execução:{" "}
                  {duration.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ms
                </div>
                <pre>
                  {JSON.stringify(
                    {
                      isValid: result.isValid,
                      errors: result.errors,
                      unknownKeys: result.unknownKeys,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </>
          ) : (
            <div className="output-state idle">
              <Code2 size={31} />
              <h3>Pronto para validar</h3>
              <p>
                O primeiro erro por campo será mostrado aqui. Ajuste uma regra
                para comparar o resultado.
              </p>
            </div>
          )}
        </section>
      </div>
      <p className="scope-note bottom-note">
        Validação de entrada não substitui autenticação, sanitização de HTML ou
        verificação no servidor. A política de composição é apenas uma regra
        demonstrativa.
      </p>
    </Shell>
  );
}
