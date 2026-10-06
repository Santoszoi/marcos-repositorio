import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { digest, randomToken } from "./crypto";
import { createMerchant, type UserRow } from "./repository";
import { HttpError, externalOrigin } from "./http";
const SESSION_SECONDS = 8 * 60 * 60;
export async function currentUser(): Promise<UserRow | null> {
  const token = (await cookies()).get("cf_session")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db()
    .prepare(
      "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
    )
    .bind(await digest(token), Date.now())
    .first<UserRow>();
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Entre na sua conta para continuar.");
  return user;
}
export async function startSession(userId: string, request: Request) {
  const token = randomToken();
  await db()
    .prepare("DELETE FROM sessions WHERE expires_at <= ?")
    .bind(Date.now())
    .run();
  await db()
    .prepare(
      "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)",
    )
    .bind(await digest(token), userId, Date.now() + SESSION_SECONDS * 1000)
    .run();
  (await cookies()).set("cf_session", token, {
    httpOnly: true,
    secure: externalOrigin(request).startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}
export async function signOut() {
  const jar = await cookies();
  const token = jar.get("cf_session")?.value;
  if (token)
    await db()
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await digest(token))
      .run();
  jar.delete("cf_session");
}
export async function demoUser(request: Request) {
  const existing = await currentUser();
  if (existing) return existing;
  const user = await createMerchant(
    `demo_${crypto.randomUUID()}`,
    "Marcos",
    null,
    true,
  );
  await startSession(user.id, request);
  return user;
}
