import { requireUser } from "@/lib/auth";
import { ownerStore } from "@/lib/repository";
import { db } from "@/lib/db";
import { sameOrigin, readJson, json, fail, HttpError } from "@/lib/http";
import { availabilitySchema } from "@/lib/validation";
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
    const body = availabilitySchema.parse(await readJson(request));
    const update = await db()
      .prepare(
        "UPDATE products SET available = ? WHERE store_id = ? AND id = ?",
      )
      .bind(body.available ? 1 : 0, result.store.id, id)
      .run();
    if (!update.meta.changes)
      throw new HttpError(404, "Produto não encontrado.");
    return json({ id, available: body.available });
  } catch (error) {
    return fail(error);
  }
}
