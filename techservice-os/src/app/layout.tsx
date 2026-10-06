import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
export const metadata: Metadata = {
  title: "TechService OS | Marcos Solutions",
  description:
    "Demonstração interativa de TechService OS, desenvolvida por Marcos Solutions.",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
