import "server-only";
import { ZodError } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function externalOrigin(request: Request) {
  // Adapters can reconstruct an internal URL. Production uses a configured
  // canonical origin; local development uses the actual HTTP Host header.
  let configured: string | undefined;
  try {
    configured = (
      getCloudflareContext().env as unknown as { APP_ORIGIN?: string }
    ).APP_ORIGIN;
  } catch {
    configured = process.env.APP_ORIGIN;
  }
  if (configured) return new URL(configured).origin;
  const url = new URL(request.url),
    host = request.headers.get("host") ?? url.host;
  const protocol = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
    ? "http:"
    : url.protocol;
  return `${protocol}//${host}`;
}
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== externalOrigin(request))
    throw new HttpError(403, "Origem da requisição não autorizada.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Envie conteúdo JSON.");
  if (Number(request.headers.get("content-length") ?? 0) > 16384)
    throw new HttpError(413, "Requisição muito grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "JSON inválido.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new HttpError(413, "Requisição muito grande.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new HttpError(400, "JSON inválido.");
  }
}
export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function fail(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return json({ error: error.issues[0]?.message ?? "Dados inválidos." }, 400);
  console.error(
    "Request failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return json(
    {
      error:
        "Não foi possível concluir agora. Seus dados não foram descartados; tente novamente.",
    },
    503,
  );
}
