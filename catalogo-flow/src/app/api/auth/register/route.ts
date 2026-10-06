import { registerSchema } from "@/lib/validation";
import { sameOrigin, readJson, json, fail, HttpError } from "@/lib/http";
import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { createMerchant, merchant, ownerStore } from "@/lib/repository";
import { startSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, "register", 5, 3600);
    const data = registerSchema.parse(await readJson(request));
    if (
      await db()
        .prepare("SELECT id FROM users WHERE username = ?")
        .bind(data.username)
        .first()
    )
      throw new HttpError(409, "Esse nome de usuário já está em uso.");
    const user = await createMerchant(
      data.username,
      data.displayName,
      await hashPassword(data.password),
      false,
    );
    await startSession(user.id, request);
    return json(
      { user: merchant(user), store: (await ownerStore(user.id))?.store },
      201,
    );
  } catch (error) {
    return fail(error);
  }
}
