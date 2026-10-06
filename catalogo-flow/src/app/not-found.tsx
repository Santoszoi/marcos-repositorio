import Link from "next/link";
export default function NotFound() {
  return (
    <main className="shell unavailable-page">
      <h1>Essa página não foi encontrada.</h1>
      <p>Confira o endereço ou volte à apresentação do projeto.</p>
      <Link href="/" className="button primary">
        Voltar à vitrine
      </Link>
    </main>
  );
}
