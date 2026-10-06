import Link from "next/link";
import {
  Activity,
  Radio,
  ShieldCheck,
  Cable,
  Gauge,
  Monitor,
  CircleCheck,
} from "lucide-react";
import Brand from "@/components/Brand";

const repo =
  "https://github.com/Santoszoi/marcos-repositorio/tree/main/noc-monitoring";
export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav aria-label="Navegação principal">
            <a href="#recursos">Recursos</a>
            <a href={repo} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link className="button small" href="/dashboard">
              Abrir painel
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="shell hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> NETWORK OPERATIONS CENTER
            </div>
            <h1>
              Sua rede.
              <br />
              Em perspectiva<span className="cyan">.</span>
            </h1>
            <p>
              Transforme métricas em visibilidade. Acompanhe o tráfego,
              identifique falhas e entenda a saúde dos ativos em um único
              painel.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/dashboard">
                Explorar demonstração
              </Link>
              <a
                className="button secondary"
                href={repo}
                target="_blank"
                rel="noreferrer"
              >
                Ver código no GitHub
              </a>
            </div>
            <div className="hero-note">
              <Radio size={15} /> Telemetria simulada · atualização a cada 3
              segundos
            </div>
          </div>
          <div
            className="hero-console"
            aria-label="Prévia ilustrativa do painel com os cinco ativos de demonstração"
          >
            <div className="console-bar">
              <span>
                <Activity size={16} /> VISÃO OPERACIONAL
              </span>
              <span className="badge green">DEMO</span>
            </div>
            <div className="console-kpis">
              <div>
                <span>Ativos monitorados</span>
                <strong>05</strong>
              </div>
              <div>
                <span>Latência média</span>
                <strong>
                  19<small> ms</small>
                </strong>
              </div>
              <div>
                <span>Saudáveis</span>
                <strong className="green-text">03</strong>
              </div>
            </div>
            <div className="signal-chart">
              <div className="signal-title">
                <span>Tráfego WAN</span>
                <span>Mbps</span>
              </div>
              <svg
                viewBox="0 0 480 160"
                role="img"
                aria-label="Exemplo ilustrativo de tráfego de download e upload"
              >
                <defs>
                  <linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#4cd6d3" stopOpacity=".25" />
                    <stop offset="1" stopColor="#4cd6d3" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[30, 70, 110, 150].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="480"
                    y1={y}
                    y2={y}
                    stroke="#22333d"
                    strokeDasharray="3 6"
                  />
                ))}
                <path
                  d="M0 96 L32 90 L64 110 L96 60 L128 69 L160 35 L192 57 L224 47 L256 80 L288 40 L320 50 L352 17 L384 44 L416 31 L448 61 L480 37 L480 160 L0 160 Z"
                  fill="url(#preview-fill)"
                />
                <path
                  d="M0 96 L32 90 L64 110 L96 60 L128 69 L160 35 L192 57 L224 47 L256 80 L288 40 L320 50 L352 17 L384 44 L416 31 L448 61 L480 37"
                  fill="none"
                  stroke="#4cd6d3"
                  strokeWidth="2.5"
                />
                <path
                  d="M0 135 L32 123 L64 130 L96 115 L128 128 L160 100 L192 120 L224 114 L256 133 L288 117 L320 128 L352 105 L384 119 L416 115 L448 130 L480 113"
                  fill="none"
                  stroke="#8db6ff"
                  strokeWidth="2"
                />
              </svg>
              <div className="chart-legend">
                <span>
                  <i className="cyan-dot" /> Download
                </span>
                <span>
                  <i className="blue-dot" /> Upload
                </span>
              </div>
            </div>
            <div className="mini-device">
              <span>
                <i className="status-dot green-bg" /> Core Router · HQ Brasília
              </span>
              <span className="mono">12 ms</span>
            </div>
            <div className="mini-device">
              <span>
                <i className="status-dot amber-bg" /> Backbone Fiber Link ·
                Filial
              </span>
              <span className="amber-text mono">45 ms</span>
            </div>
            <div className="console-footer">
              <span className="mono">05 ativos / 01 aviso / 01 falha</span>
              <span>Dados de exemplo</span>
            </div>
          </div>
        </section>
        <div className="stack-strip shell">
          <span>CONSTRUÍDO COM</span>
          <span>Next.js</span>
          <span>TypeScript</span>
          <span>Tailwind CSS</span>
          <span>Recharts</span>
        </div>
        <section className="shell feature-section" id="recursos">
          <div className="section-heading">
            <div>
              <div className="eyebrow">MENOS RUÍDO. MAIS CONTEXTO.</div>
              <h2>
                O essencial para acompanhar
                <br />a operação de rede.
              </h2>
            </div>
            <p>
              Uma demonstração focada nas informações que ajudam a reconhecer
              onde a rede precisa de atenção.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                Icon: Gauge,
                n: "01",
                title: "Performance à vista",
                body: "Ping, jitter e perda de pacotes por dispositivo, com médias calculadas sobre os ativos disponíveis.",
              },
              {
                Icon: Cable,
                n: "02",
                title: "Tráfego em movimento",
                body: "Download e upload em um histórico contínuo. Pause a atualização para analisar um momento da operação.",
              },
              {
                Icon: ShieldCheck,
                n: "03",
                title: "Status sem ambiguidade",
                body: "Saudáveis, em atenção e indisponíveis. Avisos de degradação aparecem separados das falhas críticas.",
              },
            ].map(({ Icon, n, title, body }) => (
              <article className="feature" key={n}>
                <div className="feature-top">
                  <Icon size={26} strokeWidth={1.5} />
                  <span className="mono">{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="shell scenario-section">
          <div className="scenario-copy">
            <div className="eyebrow">UM CENÁRIO PARA EXPLORAR</div>
            <h2>Do core ao link de fibra.</h2>
            <p>
              A demonstração reúne cinco ativos: dois roteadores, um switch, um
              servidor e um link de fibra. Um link degradado e um gateway
              indisponível mostram como o painel organiza a atenção da equipe.
            </p>
            <ul>
              <li>
                <CircleCheck size={18} /> Interface adaptada para desktop e
                celular
              </li>
              <li>
                <CircleCheck size={18} /> Controles para pausar e reiniciar a
                simulação
              </li>
              <li>
                <CircleCheck size={18} /> Código organizado e disponível no
                GitHub
              </li>
            </ul>
          </div>
          <div className="scenario-card">
            <Monitor size={32} strokeWidth={1.5} />
            <h3>Experimente a operação.</h3>
            <p>
              Abra o painel e veja a telemetria se atualizar. Todos os dados são
              simulados; esta versão não se conecta a equipamentos reais.
            </p>
            <Link href="/dashboard" className="button primary">
              Abrir painel NOC
            </Link>
            <span className="mono scenario-caption">
              DEMONSTRAÇÃO INTERATIVA / V1.0
            </span>
          </div>
        </section>
      </main>
      <footer className="shell footer">
        <Brand />
        <span>Projeto de Marcos Neves</span>
        <a href={repo} target="_blank" rel="noreferrer">
          Código-fonte no GitHub
        </a>
      </footer>
    </>
  );
}
