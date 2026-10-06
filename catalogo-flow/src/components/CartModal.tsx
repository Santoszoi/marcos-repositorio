"use client";
import { readApi } from "@/lib/clientApi";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, Check, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/catalog";
import type { Order, StoreInfo } from "@/types/store";
interface Result {
  order: Order;
  message: string;
  redirectUrl: string | null;
}
export default function CartModal({
  open,
  onClose,
  store,
}: {
  open: boolean;
  onClose: () => void;
  store: StoreInfo;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    cepRequest = useRef<AbortController | null>(null),
    attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal } =
    useCart();
  const [name, setName] = useState(""),
    [cep, setCep] = useState(""),
    [address, setAddress] = useState(""),
    [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [cepBusy, setCepBusy] = useState(false),
    [cepMessage, setCepMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<Result | null>(null),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [open]);
  useEffect(() => () => cepRequest.current?.abort(), []);
  function close() {
    if (busy) return;
    onClose();
    setError("");
    if (result) {
      setResult(null);
      setName("");
      setAddress("");
      setCep("");
      attempt.current = null;
    }
  }
  async function searchCep() {
    const normalized = cep.replace(/\D/g, "");
    if (normalized.length !== 8) {
      setCepMessage("Informe os oito números do CEP.");
      return;
    }
    cepRequest.current?.abort();
    const controller = new AbortController();
    cepRequest.current = controller;
    setCepBusy(true);
    setCepMessage("");
    try {
      const response = await fetch(`/api/cep/${normalized}`, {
        signal: controller.signal,
      });
      const data = await readApi<{
        street: string;
        neighborhood: string;
        city: string;
        state: string;
      }>(response);
      if (cepRequest.current !== controller) return;
      setAddress(
        [data.street, data.neighborhood, `${data.city}/${data.state}`]
          .filter(Boolean)
          .join(", "),
      );
      setCepMessage(
        "Endereço encontrado. Acrescente o número e o complemento.",
      );
    } catch (e) {
      if (!controller.signal.aborted) setCepMessage((e as Error).message);
    } finally {
      if (cepRequest.current === controller) setCepBusy(false);
    }
  }
  function changeCep(value: string) {
    cepRequest.current?.abort();
    setCepBusy(false);
    setCepMessage("");
    setCep(value.replace(/[^\d-]/g, "").slice(0, 9));
  }
  async function checkout(event: FormEvent) {
    event.preventDefault();
    if (busy || cart.length === 0) return;
    setBusy(true);
    setError("");
    try {
      let slug = store.slug;
      if (store.id === "showcase") {
        const init = await fetch("/api/auth/demo", { method: "POST" });
        const data = await readApi<{ store: StoreInfo }>(init);
        slug = data.store.slug;
      }
      const payload = {
        storeSlug: slug,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        customerName: name,
        deliveryAddress: address,
        fulfillment,
      };
      const fingerprint = JSON.stringify(payload);
      if (attempt.current?.fingerprint !== fingerprint)
        attempt.current = { fingerprint, key: crypto.randomUUID() };
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          idempotencyKey: attempt.current.key,
        }),
      });
      const data = await readApi<Result>(response);
      setResult(data);
      clearCart();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copyMessage() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.message);
      setCopied(true);
    } catch {
      setError(
        "Não foi possível copiar. Selecione o texto da mensagem abaixo.",
      );
    }
  }
  return (
    <dialog
      ref={dialog}
      className="cart-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
      aria-labelledby="cart-title"
    >
      <div className="cart-header">
        <div>
          <span className="eyebrow">{store.name}</span>
          <h2 id="cart-title">{result ? "Pedido registrado" : "Sua sacola"}</h2>
        </div>
        <button
          className="icon-button"
          onClick={close}
          disabled={busy}
          aria-label="Fechar sacola"
        >
          <X size={21} />
        </button>
      </div>
      {result ? (
        <div className="order-success">
          <span className="success-icon">
            <Check size={28} />
          </span>
          <h3>Pronto para acompanhar.</h3>
          <p>
            Pedido #{result.order.id.slice(0, 8).toUpperCase()} salvo no painel
            da loja. Esta é uma simulação: não há cobrança ou entrega real.
          </p>
          <strong className="success-total">
            {money(result.order.totalCents / 100)}
          </strong>
          <div className="success-actions">
            {result.redirectUrl && (
              <a
                className="button primary"
                href={result.redirectUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir mensagem no WhatsApp
              </a>
            )}
            <button className="button secondary" onClick={copyMessage}>
              {copied ? "Mensagem copiada" : "Copiar mensagem do pedido"}
            </button>
            <Link className="button secondary" href="/dashboard">
              Ver painel do lojista
            </Link>
          </div>
          {result.redirectUrl && (
            <p className="small muted">
              A mensagem só será enviada se você confirmar no WhatsApp.
            </p>
          )}
          <details>
            <summary>Ver mensagem preparada</summary>
            <pre>{result.message}</pre>
          </details>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </div>
      ) : cart.length === 0 ? (
        <div className="cart-empty">
          <ShoppingBag size={38} />
          <h3>Sua sacola está vazia.</h3>
          <p>Escolha algo no catálogo para começar.</p>
          <button className="button primary" onClick={close}>
            Voltar ao catálogo
          </button>
        </div>
      ) : (
        <form onSubmit={checkout}>
          <div className="cart-items">
            {cart.map((i) => (
              <div className="cart-item" key={i.product.id}>
                <div>
                  <strong>{i.product.name}</strong>
                  <span>{money(i.product.price)} por unidade</span>
                </div>
                <div className="quantity-control">
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Diminuir ${i.product.name}`}
                    onClick={() => removeFromCart(i.product.id)}
                  >
                    <Minus size={15} />
                  </button>
                  <span>{i.quantity}</span>
                  <button
                    type="button"
                    disabled={busy || i.quantity >= 20}
                    aria-label={`Aumentar ${i.product.name}`}
                    onClick={() => addToCart(i.product)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <strong>{money(i.product.price * i.quantity)}</strong>
              </div>
            ))}
          </div>
          <fieldset disabled={busy} className="checkout-fields">
            <legend>Como você quer receber?</legend>
            <div className="fulfillment-options">
              <label>
                <input
                  type="radio"
                  name="fulfillment"
                  checked={fulfillment === "pickup"}
                  onChange={() => setFulfillment("pickup")}
                />{" "}
                Retirada <span>Grátis</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="fulfillment"
                  checked={fulfillment === "delivery"}
                  onChange={() => setFulfillment("delivery")}
                />{" "}
                Entrega <span>{money(5)}</span>
              </label>
            </div>
            <label className="field-label">
              Seu nome
              <input
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como podemos chamar você?"
              />
            </label>
            {fulfillment === "delivery" && (
              <>
                <div className="cep-row">
                  <label className="field-label">
                    CEP
                    <input
                      value={cep}
                      onChange={(e) => changeCep(e.target.value)}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="00000-000"
                    />
                  </label>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={searchCep}
                    disabled={cepBusy}
                  >
                    <MapPin size={16} />
                    {cepBusy ? "Consultando…" : "Buscar CEP"}
                  </button>
                </div>
                {cepMessage && (
                  <p className="small muted" role="status">
                    {cepMessage}
                  </p>
                )}
                <label className="field-label">
                  Endereço com número e complemento
                  <textarea
                    required
                    minLength={8}
                    maxLength={300}
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro e cidade"
                  />
                </label>
              </>
            )}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setName("Marcos");
                setAddress("Endereço de demonstração, 100, Brasília/DF");
              }}
            >
              Preencher dados de exemplo
            </button>
          </fieldset>
          <div className="cart-totals">
            <div>
              <span>Subtotal</span>
              <strong>{money(getCartTotal())}</strong>
            </div>
            <div>
              <span>Entrega</span>
              <strong>{money(fulfillment === "delivery" ? 5 : 0)}</strong>
            </div>
            <div className="cart-total">
              <span>Total</span>
              <strong>
                {money(getCartTotal() + (fulfillment === "delivery" ? 5 : 0))}
              </strong>
            </div>
          </div>
          {error && (
            <p className="field-error" role="alert">
              {error} Sua sacola foi mantida.
            </p>
          )}
          <button className="button primary checkout-button" disabled={busy}>
            {busy ? "Registrando pedido…" : "Simular pedido"}
          </button>
          <p className="checkout-note">
            Demonstração sem pagamento. Os valores serão conferidos no servidor.
          </p>
        </form>
      )}
    </dialog>
  );
}
