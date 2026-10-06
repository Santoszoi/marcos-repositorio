"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { CampaignProvider } from "@/context/CampaignContext";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <CampaignProvider>
      <div className="app-shell">
        <aside className="sidebar">
          <Link className="brand" href="/">
            <span className="brand-mark">
              <BarChart3 size={23} />
            </span>
            <span>
              AdAnalytics<span className="pro">PRO</span>
            </span>
          </Link>
          <p className="nav-label">WORKSPACE</p>
          <nav aria-label="Navegação principal">
            <Link className={path === "/" ? "selected" : ""} href="/">
              <LayoutDashboard size={19} />
              Visão geral
            </Link>
            <Link
              className={path.startsWith("/campanhas") ? "selected" : ""}
              href="/campanhas/"
            >
              <Megaphone size={19} />
              Campanhas
            </Link>
          </nav>
          <div className="sidebar-footer">
            <span className="avatar">MN</span>
            <div>
              <strong>Marcos Solutions</strong>
              <small>Workspace demonstrativo</small>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <span>Inteligência de campanhas</span>
            <span className="demo-tag">Dados simulados</span>
            <a
              href="https://github.com/Santoszoi/marcos-repositorio/tree/main/adanalytics-pro"
              target="_blank"
              rel="noreferrer"
              aria-label="Código no GitHub"
            >
              <ExternalLink size={18} />
            </a>
          </header>
          <main>{children}</main>
          <footer>
            AdAnalytics Pro · Marcos Solutions{" "}
            <span>Nenhuma conta de anúncios conectada</span>
          </footer>
        </div>
      </div>
    </CampaignProvider>
  );
}
