"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, MapPin, Utensils } from "lucide-react";
import Brand from "./Brand";
import ProductCard from "./ProductCard";
import CartModal from "./CartModal";
import { CartProvider, useCart } from "@/context/CartContext";
import { money } from "@/lib/catalog";
import type { Product, StoreInfo } from "@/types/store";
function Storefront({
  store,
  products,
}: {
  store: StoreInfo;
  products: Product[];
}) {
  const [category, setCategory] = useState("Todos"),
    [open, setOpen] = useState(false);
  const { cart, getCartTotal } = useCart();
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const categories = ["Todos", ...new Set(products.map((p) => p.category))];
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav>
            <Link href="/dashboard">Painel do lojista</Link>
            <button className="button bag-header" onClick={() => setOpen(true)}>
              <ShoppingBag size={17} />
              Sacola <span className="count">{count}</span>
            </button>
          </nav>
        </div>
      </header>
      <main>
        <section className="store-hero">
          <div className="shell store-hero-inner">
            <div>
              <span className="demo-label">LOJA DE DEMONSTRAÇÃO</span>
              <h1>{store.name}</h1>
              <p>
                Escolha seu favorito.
                <br />O resto flui.
              </p>
              <div className="store-details">
                <span>
                  <MapPin size={16} />
                  Brasília, DF · exemplo
                </span>
                <span>
                  <Utensils size={16} />
                  Retirada ou entrega
                </span>
              </div>
            </div>
            <div className="store-hero-photo">
              <Image
                src="/images/burger.jpg"
                alt="Hambúrguer artesanal do catálogo de exemplo"
                fill
                priority
                sizes="(max-width:760px) 100vw, 50vw"
              />
              <div className="photo-label">
                Burger da casa <strong>{money(32.9)}</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="shell catalog-section">
          <div className="catalog-heading">
            <div>
              <span className="eyebrow">FEITO PARA ESCOLHER</span>
              <h2>Nosso cardápio</h2>
            </div>
            <span className="muted small">
              {products.length} produtos · fotos ilustrativas
            </span>
          </div>
          <div
            className="category-tabs"
            role="group"
            aria-label="Categoria de produtos"
          >
            {categories.map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                className={category === c ? "active" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {products
              .filter((p) => category === "Todos" || p.category === category)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
          {count > 0 && (
            <div className="floating-cart">
              <div>
                <ShoppingBag size={22} />
                <span>
                  {count} {count === 1 ? "item" : "itens"} na sacola
                </span>
              </div>
              <button onClick={() => setOpen(true)}>
                Ver sacola <strong>{money(getCartTotal())}</strong>
              </button>
            </div>
          )}
        </section>
      </main>
      <footer className="shell footer">
        <Brand />
        <span>Loja demonstrativa · nenhum pedido será entregue</span>
        <Link href="/">Conhecer o projeto</Link>
      </footer>
      <CartModal open={open} onClose={() => setOpen(false)} store={store} />
    </>
  );
}
export default function Shop({
  store,
  products,
}: {
  store: StoreInfo;
  products: Product[];
}) {
  return (
    <CartProvider key={store.slug} storeSlug={store.slug} products={products}>
      <Storefront store={store} products={products} />
    </CartProvider>
  );
}
