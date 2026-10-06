"use client";
import { readApi } from "@/lib/clientApi";
import { useState } from "react";
export default function DemoButton({
  dashboard = false,
  className = "button primary",
  children,
}: {
  dashboard?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/demo", { method: "POST" });
      const data = await readApi<{ store: { slug: string } }>(response);
      window.location.assign(
        dashboard ? "/dashboard" : `/loja/${data.store.slug}`,
      );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="demo-button-wrap">
      <button className={className} disabled={busy} onClick={start}>
        {busy ? "Preparando sua demonstração…" : children}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
