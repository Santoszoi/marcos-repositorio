import { requireUser } from "@/lib/auth";
import { ownerStore } from "@/lib/repository";
import { db } from "@/lib/db";
import { sameOrigin, readJson, json, fail, HttpError } from "@/lib/http";
import { settingsSchema } from "@/lib/validation";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser();
    const result = await ownerStore(user.id);
    if (!result) throw new HttpError(404, "Loja não encontrada.");
    const body = settingsSchema.parse(await readJson(request));
    await db()
      .prepare(
        "UPDATE stores SET name = ?, whatsapp_number = ? WHERE id = ? AND owner_id = ?",
      )
      .bind(body.name, body.whatsappNumber, result.store.id, user.id)
      .run();
    return json({ store: { ...result.store, ...body } });
  } catch (error) {
    return fail(error);
  }
}
