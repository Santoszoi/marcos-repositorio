import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  LockKeyhole,
  MapPin,
  Workflow,
  Check,
  Plus,
} from "lucide-react";
import Brand from "@/components/Brand";
import DemoButton from "@/components/DemoButton";
const github =
  "https://github.com/Santoszoi/marcos-repositorio/tree/main/catalogo-flow";
export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav>
            <a href="#como-funciona">O projeto</a>
            <a href={github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link className="button secondary compact" href="/login">
              Área do lojista
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="shell landing-hero">
          <div className="landing-copy">
            <div className="eyebrow">CATÁLOGO DIGITAL / DELIVERY ENGINE</div>
            <h1>
              Seu catálogo
              <br />
              vira <span>pedido.</span>
            </h1>
            <p>
              Uma experiência completa, da escolha do produto ao acompanhamento
              da operação. Simples para o cliente. Organizada para quem vende.
            </p>
            <div className="hero-actions">
              <DemoButton>Explorar a loja</DemoButton>
              <DemoButton dashboard className="button secondary">
                Testar o painel
              </DemoButton>
            </div>
            <div className="landing-note">
              <Check size={15} />
              Demonstração gratuita, sem cobrança ou entrega real
            </div>
          </div>
          <div className="landing-preview">
            <div className="preview-top">
              <span>Bistrô Brasília</span>
              <span>CATÁLOGO ONLINE</span>
            </div>
            <div className="preview-product">
              <div className="preview-photo">
                <Image
                  src="/images/burger.jpg"
                  alt="Burger da casa com queijo, alface e tomate"
                  fill
                  priority
                  sizes="(max-width:760px) 100vw, 45vw"
                />
              </div>
              <div className="preview-description">
                <div>
                  <span>O FAVORITO DA CASA</span>
                  <h2>Burger da casa</h2>
                  <p>Brioche, queijo e carne grelhada.</p>
                </div>
                <strong>R$ 32,90</strong>
              </div>
              <DemoButton className="button primary preview-cta">
                <Plus size={18} /> Experimentar o catálogo
              </DemoButton>
            </div>
            <div className="preview-order">
              <span className="order-mini-icon">
                <ShoppingBag size={21} />
              </span>
              <div>
                <strong>Da sacola para o painel</strong>
                <span>Um fluxo conectado, do começo ao fim.</span>
              </div>
            </div>
          </div>
        </section>
        <div className="shell stack-strip">
          <span>UMA EXPERIÊNCIA FULL STACK</span>
          <span>Next.js</span>
          <span>TypeScript</span>
          <span>Tailwind CSS</span>
          <span>Docker</span>
        </div>
        <section className="shell project-section" id="como-funciona">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                PÚBLICO PARA COMPRAR. PRIVADO PARA GERIR.
              </span>
              <h2>
                Uma jornada.
                <br />
                Todos os passos conectados.
              </h2>
            </div>
            <p>
              O catálogo apresenta. A sacola organiza. O servidor confere. O
              painel acompanha.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                Icon: ShoppingBag,
                number: "01",
                title: "Escolha com liberdade",
                body: "Categorias, disponibilidade e sacola com quantidades. O rascunho continua no navegador ao atualizar a página.",
              },
              {
                Icon: MapPin,
                number: "02",
                title: "Checkout com contexto",
                body: "Consulta de CEP, escolha entre retirada e entrega e mensagem estruturada para WhatsApp, quando configurado.",
              },
              {
                Icon: LockKeyhole,
                number: "03",
                title: "Operação em boas mãos",
                body: "Cadastro, login e painel privado. Cada conta acompanha seus próprios pedidos e controla a disponibilidade dos produtos.",
              },
            ].map(({ Icon, number, title, body }) => (
              <article className="feature" key={number}>
                <div>
                  <Icon size={26} />
                  <span>{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="shell connected-section">
          <div>
            <span className="eyebrow">FEITO PARA EXPLORAR</span>
            <h2>
              Veja o pedido chegar
              <br />
              ao outro lado.
            </h2>
            <p>
              Monte uma sacola, simule um pedido e abra o painel para acompanhar
              o preparo. A sua demonstração tem um ambiente próprio, separado
              dos demais visitantes.
            </p>
            <DemoButton dashboard>Entrar na demonstração</DemoButton>
          </div>
          <div className="flow-card">
            <Workflow size={29} />
            <h3>Da escolha à conclusão</h3>
            <ol>
              <li>
                <span>1</span>Cliente escolhe os produtos
              </li>
              <li>
                <span>2</span>Servidor valida e registra o pedido
              </li>
              <li>
                <span>3</span>Lojista acompanha os próximos passos
              </li>
            </ol>
            <p>
              Sem processamento de pagamento. O WhatsApp só abre quando você
              solicitar.
            </p>
          </div>
        </section>
      </main>
      <footer className="shell footer">
        <Brand />
        <span>Projeto de Marcos Neves</span>
        <a href={github} target="_blank" rel="noreferrer">
          Ver código no GitHub
        </a>
      </footer>
    </>
  );
}
