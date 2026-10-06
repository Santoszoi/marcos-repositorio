import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: { icon: "/favicon.svg" },
  title: {
    default: "NOC Telemetry Center | Marcos Neves",
    template: "%s | NOC Telemetry Center",
  },
  description:
    "Visibilidade de rede em uma experiência clara. Explore a vitrine e o painel NOC com telemetria simulada, tráfego e status dos ativos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
