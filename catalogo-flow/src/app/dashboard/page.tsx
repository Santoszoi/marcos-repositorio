import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ownerStore, listOrders, merchant } from "@/lib/repository";
import MerchantDashboard from "@/components/MerchantDashboard";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  try {
    const result = await ownerStore(user.id);
    if (!result) throw new Error("Store unavailable");
    return (
      <MerchantDashboard
        user={merchant(user)}
        store={result.store}
        products={result.products}
        initialOrders={await listOrders(result.store.id)}
      />
    );
  } catch {
    return (
      <main className="shell unavailable-page">
        <h1>Não foi possível carregar seu painel.</h1>
        <p>
          Seus pedidos não foram apagados. Tente novamente em alguns instantes.
        </p>
        <a className="button primary" href="/dashboard">
          Tentar novamente
        </a>
      </main>
    );
  }
}
