import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Form Schema Validator | Marcos Solutions",
  description: "Explore a demonstração interativa de Form Schema Validator.",
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
