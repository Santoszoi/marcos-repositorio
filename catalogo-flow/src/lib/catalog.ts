import type { Product, StoreInfo } from "@/types/store";
export const products: Product[] = [
  {
    id: "burger",
    name: "Burger da casa",
    description:
      "Pão brioche, carne grelhada, queijo, alface e tomate. O clássico que sempre combina.",
    price: 32.9,
    imageUrl: "/images/burger.jpg",
    category: "Hambúrgueres",
    available: true,
  },
  {
    id: "pizza",
    name: "Pizza margherita",
    description:
      "Massa artesanal, molho de tomate, muçarela e manjericão fresco. Serve duas pessoas.",
    price: 49.9,
    imageUrl: "/images/pizza.jpg",
    category: "Pizzas",
    available: true,
  },
  {
    id: "fries",
    name: "Batatas crocantes",
    description:
      "Uma porção dourada e crocante com molho da casa para acompanhar.",
    price: 18.9,
    imageUrl: "/images/fries.jpg",
    category: "Acompanhamentos",
    available: true,
  },
  {
    id: "brownie",
    name: "Brownie de chocolate",
    description:
      "Chocolate intenso, casquinha delicada e interior macio. Para terminar bem.",
    price: 14.9,
    imageUrl: "/images/dessert.jpg",
    category: "Sobremesas",
    available: true,
  },
];
export const showcaseStore: StoreInfo = {
  id: "showcase",
  name: "Bistrô Brasília",
  slug: "bistro-brasilia",
  whatsappNumber: "",
  currency: "BRL",
  isDemo: true,
};
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
export const cents = (value: number) => Math.round(value * 100);
