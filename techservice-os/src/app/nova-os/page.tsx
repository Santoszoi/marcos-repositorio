"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  UserRound,
  ListChecks,
  FileText,
  Save,
} from "lucide-react";
import { useOrders } from "@/context/OrderContext";
import type { ServiceItem, OrderService } from "@/types/service";
import { money, totalCents } from "@/lib/service";
type DraftItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};
export default function NewOrder() {
  const router = useRouter();
  const { addOrder, loading, error, message } = useOrders();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { id: "first", description: "", quantity: "1", unitPrice: "" },
  ]);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const errorsRef = useRef<HTMLDivElement>(null);
  const parsed: ServiceItem[] = items.map((i) => ({
    ...i,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice.replace(",", ".")),
  }));
  const cents = totalCents(
    parsed.filter(
      (i) => Number.isFinite(i.unitPrice) && Number.isFinite(i.quantity),
    ),
  );
  function update(id: string, key: keyof DraftItem, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)),
    );
  }
  function fail(text: string) {
    setFormError(text);
    requestAnimationFrame(() => errorsRef.current?.focus());
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFormError("");
    if (name.trim().length < 2) {
      fail("Informe o nome do cliente.");
      return;
    }
    if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) {
      fail("Informe um telefone com DDD, com 10 ou 11 dígitos.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      fail("Informe um e-mail válido.");
      return;
    }
    if (
      items.some(
        (i, n) =>
          !i.description.trim() ||
          i.unitPrice.trim() === "" ||
          !/^\d+(?:[.,]\d{1,2})?$/.test(i.unitPrice.trim()) ||
          !Number.isInteger(parsed[n].quantity) ||
          parsed[n].quantity < 1 ||
          parsed[n].quantity > 100 ||
          parsed[n].unitPrice > 100000,
      )
    ) {
      fail(
        "Revise os serviços: descrição, quantidade de 1 a 100 e preço de até R$ 100.000,00 com até duas casas decimais.",
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    const id = crypto.randomUUID();
    const now = new Date();
    const date = now
      .toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })
      .replaceAll("-", "");
    const order: OrderService = {
      id,
      protocol: `${date}-${id.slice(0, 8).toUpperCase()}`,
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      items: parsed.map((i) => ({ ...i, description: i.description.trim() })),
      status: "Pendente",
      createdAt: now.toISOString(),
      notes: notes.trim() || undefined,
    };
    if (addOrder(order)) {
      router.push("/");
    } else {
      setBusy(false);
      submitting.current = false;
      fail("Não foi possível salvar. Confira a mensagem abaixo.");
    }
  }
  function fill() {
    setName("Empresa de exemplo");
    setPhone("(61) 90000-0004");
    setEmail("cliente@example.com");
    setNotes("Ordem fictícia para explorar a demonstração.");
    setItems([
      {
        id: crypto.randomUUID(),
        description: "Desenvolvimento de página institucional",
        quantity: "1",
        unitPrice: "1200.00",
      },
      {
        id: crypto.randomUUID(),
        description: "Configuração de domínio",
        quantity: "1",
        unitPrice: "150.00",
      },
    ]);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CENTRAL DE OPERAÇÕES / NOVA O.S.</p>
          <h1>Uma nova entrega começa aqui.</h1>
          <p>Cadastre o cliente, detalhe os serviços e confira o orçamento.</p>
        </div>
        <Link className="button secondary" href="/">
          Voltar ao painel
        </Link>
      </div>
      <div className="demo-banner">
        <span>
          Use dados fictícios. Este cadastro fica somente no navegador atual.
        </span>
        <button onClick={fill}>Preencher exemplo</button>
      </div>
      <form onSubmit={submit} noValidate className="order-form">
        <div className="form-main">
          {formError && (
            <div tabIndex={-1} ref={errorsRef} className="error" role="alert">
              {formError}
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="feedback" role="status">
              {message}
            </div>
          )}
          <section className="form-section">
            <div className="form-title">
              <UserRound size={19} />
              <h2>Dados do cliente</h2>
              <span>01</span>
            </div>
            <div className="form-fields">
              <label className="full">
                Nome ou razão social
                <input
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                  autoComplete="organization"
                />
              </label>
              <label>
                Telefone com DDD
                <input
                  required
                  type="tel"
                  maxLength={22}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(61) 90000-0000"
                  autoComplete="tel"
                />
              </label>
              <label>
                E-mail
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@example.com"
                  autoComplete="email"
                />
              </label>
            </div>
          </section>
          <section className="form-section">
            <div className="form-title">
              <ListChecks size={19} />
              <h2>Serviços e valores</h2>
              <span>02</span>
            </div>
            <div className="service-items">
              {items.map((i, n) => (
                <fieldset className="service-row" key={i.id}>
                  <legend>Serviço {n + 1}</legend>
                  <label>
                    Descrição
                    <input
                      required
                      maxLength={200}
                      value={i.description}
                      onChange={(e) =>
                        update(i.id, "description", e.target.value)
                      }
                      placeholder="Descrição do serviço"
                    />
                  </label>
                  <label>
                    Quantidade
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={i.quantity}
                      onChange={(e) => update(i.id, "quantity", e.target.value)}
                    />
                  </label>
                  <label>
                    Preço unitário (R$)
                    <input
                      required
                      inputMode="decimal"
                      value={i.unitPrice}
                      maxLength={12}
                      placeholder="0,00"
                      onChange={(e) =>
                        update(i.id, "unitPrice", e.target.value)
                      }
                    />
                  </label>
                  <div className="subtotal">
                    <small>Subtotal</small>
                    <strong>
                      {money(
                        Number.isFinite(parsed[n].unitPrice)
                          ? (Math.round(parsed[n].unitPrice * 100) *
                              (parsed[n].quantity || 0)) /
                              100
                          : 0,
                      )}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={items.length === 1}
                    aria-label={`Remover serviço ${n + 1}`}
                    onClick={() =>
                      setItems((prev) => prev.filter((x) => x.id !== i.id))
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </fieldset>
              ))}
            </div>
            <button
              type="button"
              className="button secondary"
              disabled={items.length >= 20}
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    description: "",
                    quantity: "1",
                    unitPrice: "",
                  },
                ])
              }
            >
              <Plus size={17} />
              Adicionar serviço
            </button>
          </section>
          <section className="form-section">
            <div className="form-title">
              <FileText size={19} />
              <h2>Observações</h2>
              <span>03</span>
            </div>
            <label>
              Detalhes adicionais (opcional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Escopo, equipamentos ou orientações para a execução"
              />
            </label>
            <small className="char-count">
              {notes.length}/1.000 caracteres
            </small>
          </section>
        </div>
        <aside className="order-summary">
          <p className="eyebrow">RESUMO DA ORDEM</p>
          <h2>Confira antes de salvar</h2>
          <div className="summary-line">
            <span>Serviços</span>
            <strong>{items.length}</strong>
          </div>
          <div className="summary-line">
            <span>Status inicial</span>
            <span className="status Pendente">Pendente</span>
          </div>
          <div className="summary-total">
            <span>Valor total</span>
            <strong>{money(cents / 100)}</strong>
          </div>
          <button
            className="button primary"
            type="submit"
            disabled={loading || !!error || busy}
          >
            <Save size={17} />
            {busy
              ? "Salvando…"
              : loading
                ? "Carregando…"
                : "Salvar ordem de serviço"}
          </button>
          <p>
            O protocolo será gerado ao salvar. Você poderá acompanhar a execução
            no painel.
          </p>
          <Link href="/" className="cancel-link">
            Cancelar cadastro
          </Link>
        </aside>
      </form>
    </>
  );
}
