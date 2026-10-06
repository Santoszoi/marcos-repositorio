import { lookupCep, CepError } from "@/lib/cep";
import { json, fail } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cep: string }> },
) {
  try {
    const { cep } = await params;
    await rateLimit(request, "cep", 30, 60);
    return json(await lookupCep(cep, fetch, request.signal));
  } catch (error) {
    return error instanceof CepError
      ? json({ error: error.message }, error.status)
      : fail(error);
  }
}
