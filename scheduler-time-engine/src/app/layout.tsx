import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Scheduler Time Engine | Marcos Solutions",
  description: "Explore a demonstração interativa de Scheduler Time Engine.",
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
