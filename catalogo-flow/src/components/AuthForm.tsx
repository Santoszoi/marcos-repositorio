"use client";
import { readApi } from "@/lib/clientApi";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import DemoButton from "./DemoButton";
export default function AuthForm() {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      username: form.get("username"),
      password: form.get("password"),
      ...(register ? { displayName: form.get("displayName") } : {}),
    };
    try {
      const response = await fetch(
        `/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      await readApi(response);
      window.location.assign("/dashboard");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <section className="auth-card">
      <span className="auth-icon">
        <LockKeyhole size={24} />
      </span>
      <h1>{register ? "Sua loja começa aqui." : "Bem-vindo de volta."}</h1>
      <p>
        {register
          ? "Crie uma conta para ter sua loja e um painel privado de demonstração."
          : "Entre para acompanhar os pedidos e cuidar do catálogo."}
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {register && (
            <label className="field-label">
              Seu nome
              <input
                name="displayName"
                required
                minLength={2}
                maxLength={60}
                autoComplete="name"
                placeholder="Marcos"
              />
            </label>
          )}
          <label className="field-label">
            Usuário
            <input
              name="username"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_.\-]{3,32}"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Seu nome de usuário"
            />
          </label>
          <label className="field-label">
            Senha
            <input
              name="password"
              type="password"
              required
              minLength={register ? 12 : 1}
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder={register ? "Pelo menos 12 caracteres" : "Sua senha"}
            />
          </label>
          {register && (
            <p className="small muted">
              Use uma senha exclusiva para este projeto. Esta versão não oferece
              recuperação de senha.
            </p>
          )}
        </fieldset>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy
            ? "Aguarde…"
            : register
              ? "Criar minha conta"
              : "Entrar no painel"}
        </button>
      </form>
      <button
        className="text-button auth-switch"
        disabled={busy}
        onClick={() => {
          setRegister((r) => !r);
          setError("");
        }}
      >
        {register ? "Já tenho uma conta" : "Ainda não tenho uma conta"}
      </button>
      <div className="auth-divider">
        <span>ou conheça o projeto</span>
      </div>
      <DemoButton dashboard className="button secondary">
        Entrar na demonstração
      </DemoButton>
      <p className="auth-note">
        Ambiente de teste individual, sem senha compartilhada.
      </p>
      <Link className="text-button" href="/">
        Voltar à vitrine
      </Link>
    </section>
  );
}
