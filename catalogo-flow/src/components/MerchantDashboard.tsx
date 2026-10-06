"use client";
import { readApi } from "@/lib/clientApi";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Settings,
  RefreshCw,
  LogOut,
  ExternalLink,
  ClipboardList,
  Clock,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import Brand from "./Brand";
import { money } from "@/lib/catalog";
import { statusLabels, transitions } from "@/lib/orderState";
import type {
  Merchant,
  StoreInfo,
  Product,
  Order,
  OrderStatus,
} from "@/types/store";
const actionLabels: Partial<Record<OrderStatus, string>> = {
  preparing: "Iniciar preparo",
  ready: "Marcar como pronto",
  completed: "Concluir pedido",
  cancelled: "Cancelar",
};
export default function MerchantDashboard({
  user,
  store: initialStore,
  products: initialProducts,
  initialOrders,
}: {
  user: Merchant;
  store: StoreInfo;
  products: Product[];
  initialOrders: Order[];
}) {
  const [tab, setTab] = useState<"orders" | "catalog" | "settings">("orders"),
    [store, setStore] = useState(initialStore),
    [products, setProducts] = useState(initialProducts),
    [orders, setOrders] = useState(initialOrders);
  const [pendingId, setPendingId] = useState<string | null>(null),
    [pendingProduct, setPendingProduct] = useState<string | null>(null),
    [refreshing, setRefreshing] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [storeName, setStoreName] = useState(initialStore.name),
    [phone, setPhone] = useState(initialStore.whatsappNumber),
    [leaving, setLeaving] = useState(false);
  const controller = useRef<AbortController | null>(null);
  async function refresh() {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setRefreshing(true);
    try {
      const response = await fetch("/api/orders", { signal: current.signal });
      const result = await readApi<{ orders: Order[] }>(response);
      if (controller.current === current) {
        setOrders(result.orders);
        setError("");
      }
    } catch (e) {
      if (!current.signal.aborted) setError((e as Error).message);
    } finally {
      if (controller.current === current) setRefreshing(false);
    }
  }
  useEffect(() => {
    if (pendingId) return;
    const interval = setInterval(() => {
      void refresh();
    }, 15000);
    return () => {
      clearInterval(interval);
      controller.current?.abort();
    };
  }, [pendingId]);
  async function changeStatus(order: Order, status: OrderStatus) {
    if (pendingId) return;
    setPendingId(order.id);
    controller.current?.abort();
    setError("");
    setOrders((previous) =>
      previous.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await readApi(response);
      setNotice(`Pedido #${order.id.slice(0, 8).toUpperCase()} atualizado.`);
    } catch (e) {
      setOrders((previous) =>
        previous.map((o) =>
          o.id === order.id ? { ...o, status: order.status } : o,
        ),
      );
      setError((e as Error).message);
    } finally {
      setPendingId(null);
    }
  }
  async function toggleProduct(product: Product) {
    if (pendingProduct) return;
    setPendingProduct(product.id);
    setError("");
    setProducts((previous) =>
      previous.map((p) =>
        p.id === product.id ? { ...p, available: !p.available } : p,
      ),
    );
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !product.available }),
      });
      await readApi(response);
      setNotice("Disponibilidade atualizada no catálogo.");
    } catch (e) {
      setProducts((previous) =>
        previous.map((p) =>
          p.id === product.id ? { ...p, available: product.available } : p,
        ),
      );
      setError((e as Error).message);
    } finally {
      setPendingProduct(null);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storeName, whatsappNumber: phone }),
      });
      const data = await readApi<{ store: StoreInfo }>(response);
      setStore(data.store);
      setNotice("Configurações salvas.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    setLeaving(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok)
        throw new Error("Não foi possível sair. Tente novamente.");
      window.location.assign("/login");
    } catch (e) {
      setError((e as Error).message);
      setLeaving(false);
    }
  }
  const active = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  ).length;
  const value = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalCents, 0);
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav>
            <Link
              href={`/loja/${store.slug}`}
              className="button secondary compact"
              target="_blank"
            >
              <ExternalLink size={16} />
              Abrir loja
            </Link>
            <button
              className="icon-button logout"
              aria-label="Sair da conta"
              disabled={leaving}
              onClick={logout}
            >
              <LogOut size={20} />
            </button>
          </nav>
        </div>
      </header>
      <main className="shell merchant-dashboard">
        <div className="merchant-heading">
          <div>
            <span className="eyebrow">
              PAINEL DO LOJISTA /{" "}
              {user.isDemo ? "CONTA DE DEMONSTRAÇÃO" : "ÁREA PRIVADA"}
            </span>
            <h1>
              Olá, {user.displayName}
              <span>.</span>
            </h1>
            <p>{store.name} · Acompanhe a operação e cuide do catálogo.</p>
          </div>
          <span className="private-label">Sua loja. Seus pedidos.</span>
        </div>
        <div className="dashboard-notice">
          Ambiente de demonstração. Use dados fictícios nos pedidos; não há
          pagamentos ou entregas reais.
          {user.isDemo && " A sessão de teste dura até oito horas."}
        </div>
        <div className="merchant-kpis">
          {[
            {
              Icon: ClipboardList,
              label: "Pedidos recebidos",
              value: orders.length,
            },
            { Icon: Clock, label: "Em andamento", value: active },
            {
              Icon: Wallet,
              label: "Valor simulado",
              value: money(value / 100),
            },
            {
              Icon: CheckCircle2,
              label: "Produtos disponíveis",
              value: `${products.filter((p) => p.available).length}/${products.length}`,
            },
          ].map(({ Icon, label, value }) => (
            <section key={label}>
              <div>
                <span>{label}</span>
                <Icon size={19} />
              </div>
              <strong>{value}</strong>
            </section>
          ))}
        </div>
        <div className="dashboard-toolbar">
          <div
            className="dashboard-tabs"
            role="group"
            aria-label="Seções do painel"
          >
            {[
              { key: "orders", Icon: ShoppingBag, label: "Pedidos" },
              { key: "catalog", Icon: Package, label: "Catálogo" },
              { key: "settings", Icon: Settings, label: "Configurações" },
            ].map(({ key, Icon, label }) => (
              <button
                key={key}
                aria-pressed={tab === key}
                className={tab === key ? "active" : ""}
                onClick={() => {
                  setTab(key as typeof tab);
                  setError("");
                  setNotice("");
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
          {tab === "orders" && (
            <button
              className="button secondary compact"
              onClick={() => void refresh()}
              disabled={refreshing || !!pendingId}
            >
              <RefreshCw size={15} />
              {refreshing ? "Atualizando…" : "Atualizar"}
            </button>
          )}
        </div>
        {error && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="alert success" role="status">
            {notice}
          </p>
        )}
        {tab === "orders" && (
          <section className="orders-panel">
            <div className="panel-heading">
              <h2>Pedidos da loja</h2>
              <span>Atualização a cada 15 segundos · últimos 100 pedidos</span>
            </div>
            {orders.length === 0 ? (
              <div className="empty-orders">
                <ShoppingBag size={37} />
                <h3>O próximo pedido começa na loja.</h3>
                <p>
                  Abra o catálogo, escolha um produto e simule um pedido. Ele
                  vai aparecer aqui.
                </p>
                <Link className="button primary" href={`/loja/${store.slug}`}>
                  Explorar minha loja
                </Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <article className="order-card" key={order.id}>
                    <div className="order-heading">
                      <div>
                        <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                        <time
                          dateTime={new Date(order.createdAt).toISOString()}
                        >
                          {new Date(order.createdAt).toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <span className={`order-status ${order.status}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <h3>{order.customerName}</h3>
                    <p className="order-address">
                      {order.fulfillment === "pickup"
                        ? "Retirada no local"
                        : order.deliveryAddress}
                    </p>
                    <ul>
                      {order.items.map((i) => (
                        <li key={i.productId}>
                          <span>
                            {i.quantity}× {i.name}
                          </span>
                          <strong>
                            {money((i.priceCents * i.quantity) / 100)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                    <div className="order-total">
                      <span>
                        Total{" "}
                        {order.deliveryFeeCents > 0 && (
                          <small>· inclui entrega</small>
                        )}
                      </span>
                      <strong>{money(order.totalCents / 100)}</strong>
                    </div>
                    {transitions[order.status].length > 0 && (
                      <div className="order-actions">
                        {transitions[order.status].map((status) => (
                          <button
                            key={status}
                            className={`button compact ${status === "cancelled" ? "text-cancel" : "primary"}`}
                            disabled={!!pendingId}
                            onClick={() => void changeStatus(order, status)}
                          >
                            {pendingId === order.id
                              ? "Salvando…"
                              : actionLabels[status]}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {tab === "catalog" && (
          <section className="catalog-admin">
            <div className="panel-heading">
              <h2>Disponibilidade dos produtos</h2>
              <span>As mudanças aparecem na próxima abertura da loja.</span>
            </div>
            <div className="admin-products">
              {products.map((product) => (
                <article key={product.id}>
                  <div className="admin-product-photo">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <h3>{product.name}</h3>
                    <p>
                      {money(product.price)} · {product.category}
                    </p>
                  </div>
                  <button
                    className={`availability-toggle ${product.available ? "on" : ""}`}
                    role="switch"
                    aria-checked={product.available}
                    aria-label={`Disponibilidade de ${product.name}`}
                    disabled={!!pendingProduct}
                    onClick={() => void toggleProduct(product)}
                  >
                    <span />
                    {product.available ? "Disponível" : "Esgotado"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "settings" && (
          <section className="settings-panel">
            <div className="panel-heading">
              <h2>O jeito da sua loja</h2>
              <span>Configurações privadas da sua conta.</span>
            </div>
            <form onSubmit={save}>
              <fieldset disabled={saving}>
                <label className="field-label">
                  Nome da loja
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  WhatsApp para receber a mensagem do pedido
                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
                    }
                    inputMode="tel"
                    placeholder="País + DDD + número"
                    maxLength={15}
                  />
                </label>
                <p className="small muted">
                  Opcional. Use apenas números, incluindo o código do país. O
                  cliente precisará confirmar o envio no WhatsApp.
                </p>
                <div className="store-link-info">
                  <strong>Link do catálogo</strong>
                  <Link href={`/loja/${store.slug}`} target="_blank">
                    /loja/{store.slug}
                  </Link>
                </div>
              </fieldset>
              <button className="button primary" disabled={saving}>
                {saving ? "Salvando…" : "Salvar configurações"}
              </button>
            </form>
          </section>
        )}
        <div className="dashboard-footer">
          <span>Catálogo Flow · Projeto de Marcos Neves</span>
          <Link href="/">Voltar à vitrine</Link>
        </div>
      </main>
    </>
  );
}
