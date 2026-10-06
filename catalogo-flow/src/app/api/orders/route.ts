import { requireUser } from "@/lib/auth";
import { ownerStore, listOrders } from "@/lib/repository";
import { json, fail, HttpError } from "@/lib/http";
export async function GET() {
  try {
    const user = await requireUser();
    const result = await ownerStore(user.id);
    if (!result) throw new HttpError(404, "Loja não encontrada.");
    return json({ orders: await listOrders(result.store.id) });
  } catch (error) {
    return fail(error);
  }
}
