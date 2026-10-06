"use client";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { cartReducer, restoreCart, cartTotalCents } from "@/lib/cartState";
import type { CartItem, Product } from "@/types/store";
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  ready: boolean;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export function CartProvider({
  children,
  storeSlug,
  products,
}: {
  children: ReactNode;
  storeSlug: string;
  products: Product[];
}) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [ready, setReady] = useState(false);
  const snapshot = useRef(cart);
  useEffect(() => {
    snapshot.current = cart;
  }, [cart]);
  const key = `catalogo-flow:cart:v1:${storeSlug}`;
  useEffect(() => {
    try {
      dispatch({
        type: "restore",
        items: restoreCart(
          JSON.parse(localStorage.getItem(key) ?? "[]"),
          products,
        ),
      });
    } catch {
      dispatch({ type: "clear" });
    }
    setReady(true);
  }, [key, products]);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(
          key,
          JSON.stringify(
            cart.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          ),
        );
      } catch {
        /* The cart remains usable without browser storage. */
      }
    }
  }, [cart, key, ready]);
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "get_catalog_cart",
            description:
              "Read the current cart draft, item quantities and subtotal in BRL cents. This does not create or send an order.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input) {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Expected an empty object.");
              return {
                storeSlug,
                items: snapshot.current.map((item) => ({
                  productId: item.product.id,
                  name: item.product.name,
                  quantity: item.quantity,
                })),
                totalCents: cartTotalCents(snapshot.current),
                currency: "BRL",
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Optional browser support must not interrupt the cart. */
    }
    return () => lifecycle.abort();
  }, [storeSlug]);
  return (
    <CartContext.Provider
      value={{
        cart,
        ready,
        addToCart: (product) => dispatch({ type: "add", product }),
        removeFromCart: (productId) => dispatch({ type: "remove", productId }),
        clearCart: () => dispatch({ type: "clear" }),
        getCartTotal: () => cartTotalCents(cart) / 100,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  return context;
}
