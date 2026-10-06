import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Catálogo Flow | Marcos Neves",
    template: "%s | Catálogo Flow",
  },
  description:
    "Catálogo digital interativo com sacola, consulta de CEP e painel privado de pedidos. Explore o projeto de Marcos Neves.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
