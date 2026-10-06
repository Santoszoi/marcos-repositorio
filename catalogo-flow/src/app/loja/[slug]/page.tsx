import { notFound } from "next/navigation";
import { getStore } from "@/lib/repository";
import Shop from "@/components/Shop";
export const dynamic = "force-dynamic";
export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let result;
  try {
    result = await getStore(slug);
  } catch {
    return (
      <main className="shell unavailable-page">
        <h1>O catálogo está temporariamente indisponível.</h1>
        <p>Tente abrir a loja novamente em alguns instantes.</p>
        <a
          className="button primary"
          href={`/loja/${encodeURIComponent(slug)}`}
        >
          Tentar novamente
        </a>
      </main>
    );
  }
  if (!result) notFound();
  return <Shop store={result.store} products={result.products} />;
}
