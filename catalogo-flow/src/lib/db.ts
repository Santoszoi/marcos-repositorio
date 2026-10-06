import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
export function db(): D1Database {
  const { env } = getCloudflareContext();
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding) throw new Error("Database binding is unavailable");
  return binding;
}
