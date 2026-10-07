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
            <span className="brand-mark">F</span>
            <span>
              Form Schema Validator<small>Marcos Solutions / Engine Lab</small>
            </span>
          </a>
          <div className="header-links">
            <span className="demo-tag">Demonstração interativa</span>
            <a
              className="code-link"
              href="https://github.com/Santoszoi/marcos-repositorio/tree/main/form-schema-validator"
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
          href="https://github.com/Santoszoi/marcos-repositorio/tree/main/form-schema-validator#architecture"
          target="_blank"
          rel="noreferrer"
        >
          Documentação técnica em inglês
        </a>
      </footer>
    </>
  );
}
