import { requireUser } from "@/lib/auth";
import { ownerStore } from "@/lib/repository";
import { db } from "@/lib/db";
import { sameOrigin, readJson, json, fail, HttpError } from "@/lib/http";
import { statusSchema } from "@/lib/validation";
import { transitions } from "@/lib/orderState";
import type { OrderStatus } from "@/types/store";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const user = await requireUser();
    const result = await ownerStore(user.id);
    if (!result) throw new HttpError(404, "Loja não encontrada.");
    const { id } = await params;
    const body = statusSchema.parse(await readJson(request));
    const order = await db()
      .prepare("SELECT status FROM orders WHERE id = ? AND store_id = ?")
      .bind(id, result.store.id)
      .first<{ status: OrderStatus }>();
    if (!order) throw new HttpError(404, "Pedido não encontrado.");
    if (!transitions[order.status]?.includes(body.status))
      throw new HttpError(
        409,
        "Esta mudança de status não está disponível. Atualize os pedidos.",
      );
    const updated = await db()
      .prepare(
        "UPDATE orders SET status = ? WHERE id = ? AND store_id = ? AND status = ?",
      )
      .bind(body.status, id, result.store.id, order.status)
      .run();
    if (!updated.meta.changes)
      throw new HttpError(409, "O pedido foi alterado. Atualize a lista.");
    return json({ id, status: body.status });
  } catch (error) {
    return fail(error);
  }
}
