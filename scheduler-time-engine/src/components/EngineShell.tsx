import { ExternalLink } from "lucide-react";
export default function EngineShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="brand">
            <span className="brand-mark">S</span>
            <span>
              Scheduler Time Engine<small>Marcos Solutions / Engine Lab</small>
            </span>
          </a>
          <div className="header-links">
            <span className="demo-tag">Demonstração interativa</span>
            <a
              className="code-link"
              href="https://github.com/Santoszoi/marcos-repositorio/tree/main/scheduler-time-engine"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <span>Marcos Solutions · TypeScript Engine Lab</span>
        <a
          href="https://github.com/Santoszoi/marcos-repositorio/tree/main/scheduler-time-engine#architecture"
          target="_blank"
          rel="noreferrer"
        >
          Documentação técnica em inglês
        </a>
      </footer>
    </>
  );
}
