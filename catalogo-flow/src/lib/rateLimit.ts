import "server-only";
import { db } from "./db";
import { digest } from "./crypto";
import { HttpError } from "./http";
export async function rateLimit(
  request: Request,
  action: string,
  limit: number,
  seconds: number,
  subject = "",
) {
  const address = request.headers.get("cf-connecting-ip") ?? "local";
  const now = Math.floor(Date.now() / 1000),
    window = Math.floor(now / seconds);
  const key = await digest(`${action}|${address}|${subject}|${window}`);
  await db()
    .prepare("DELETE FROM rate_limits WHERE expires_at < ?")
    .bind(now)
    .run();
  const result = await db()
    .prepare(
      "INSERT INTO rate_limits (key,hits,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits",
    )
    .bind(key, (window + 1) * seconds)
    .first<{ hits: number }>();
  if (!result || result.hits > limit)
    throw new HttpError(
      429,
      "Muitas tentativas. Aguarde um pouco e tente novamente.",
    );
}
