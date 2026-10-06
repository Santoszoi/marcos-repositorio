import { loginSchema } from "@/lib/validation";
import { sameOrigin, readJson, json, fail, HttpError } from "@/lib/http";
import { verifyPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { merchant, ownerStore, type UserRow } from "@/lib/repository";
import { startSession, signOut } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
const DUMMY_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYIaJ4jJG5QaJNDTBhESkJSHyVVBOQi";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, "login", 20, 900);
    const data = loginSchema.parse(await readJson(request));
    await rateLimit(request, "login-account", 6, 900, data.username);
    const user = await db()
      .prepare("SELECT * FROM users WHERE username = ? AND is_demo = 0")
      .bind(data.username)
      .first<UserRow>();
    const valid = await verifyPassword(
      data.password,
      user?.password_hash ?? DUMMY_HASH,
    );
    if (!user || !valid)
      throw new HttpError(401, "Usuário ou senha incorretos.");
    await signOut();
    await startSession(user.id, request);
    return json({
      user: merchant(user),
      store: (await ownerStore(user.id))?.store,
    });
  } catch (error) {
    return fail(error);
  }
}
