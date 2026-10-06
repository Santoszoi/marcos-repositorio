"use client";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/catalog";
import type { Product } from "@/types/store";
export default function ProductCard({ product }: { product: Product }) {
  const { cart, addToCart, removeFromCart, ready } = useCart();
  const quantity =
    cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
  return (
    <article
      className={`product-card ${!product.available ? "unavailable" : ""}`}
    >
      <div className="product-photo">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width:600px) 100vw, (max-width:1100px) 50vw, 33vw"
        />
        {!product.available && <span className="sold-out">Esgotado</span>}
      </div>
      <div className="product-body">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          {quantity > 0 ? (
            <div className="quantity-control">
              <button
                aria-label={`Remover uma unidade de ${product.name}`}
                onClick={() => removeFromCart(product.id)}
              >
                <Minus size={16} />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                aria-label={`Adicionar uma unidade de ${product.name}`}
                disabled={quantity >= 20 || !product.available}
                onClick={() => addToCart(product)}
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              className="add-button"
              disabled={!product.available || !ready}
              onClick={() => addToCart(product)}
              aria-label={`Adicionar ${product.name} à sacola`}
            >
              <Plus size={16} />
              {product.available ? "Adicionar" : "Esgotado"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
