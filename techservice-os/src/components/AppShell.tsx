"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Plus, ExternalLink } from "lucide-react";
import { OrderProvider } from "@/context/OrderContext";
export default function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  return (
    <OrderProvider>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <span className="brand-icon">
              <Wrench size={22} />
            </span>
            <span>
              TechService<span className="brand-os">OS</span>
            </span>
          </Link>
          <nav aria-label="Navegação principal">
            <Link className={p === "/" ? "selected" : ""} href="/">
              Visão geral
            </Link>
            <Link
              className={p.startsWith("/nova-os") ? "selected" : ""}
              href="/nova-os/"
            >
              Nova O.S.
            </Link>
          </nav>
          <div className="account">
            <span className="demo-tag">Demonstração</span>
            <span className="avatar" aria-label="Marcos">
              MN
            </span>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <span>TechService OS · Marcos Solutions</span>
        <a
          href="https://github.com/Santoszoi/marcos-repositorio/tree/main/techservice-os"
          target="_blank"
          rel="noreferrer"
        >
          Código no GitHub <ExternalLink size={14} />
        </a>
      </footer>
    </OrderProvider>
  );
}
