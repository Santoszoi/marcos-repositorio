import { z } from "zod";
const responseSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  bairro: z.string(),
  localidade: z.string().min(1),
  uf: z.string().length(2),
});
export class CepError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export interface Address {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
const cache = new Map<string, { expires: number; address: Address }>();
export async function lookupCep(
  cep: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<Address> {
  if (!/^\d{8}$/.test(cep))
    throw new CepError(400, "Informe um CEP com oito números.");
  const cached = fetcher === fetch ? cache.get(cep) : undefined;
  if (cached && cached.expires > Date.now()) return cached.address;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const timeout = AbortSignal.timeout(3500);
      const response = await fetcher(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status >= 500 || response.status === 429)
          throw new Error("Transient upstream failure");
        throw new CepError(
          503,
          "A consulta de CEP está indisponível. Preencha o endereço manualmente.",
        );
      }
      const raw = await response.json();
      if (
        z
          .object({ erro: z.union([z.literal(true), z.literal("true")]) })
          .safeParse(raw).success
      )
        throw new CepError(
          404,
          "CEP não encontrado. Confira o número ou preencha o endereço manualmente.",
        );
      const parsed = responseSchema.safeParse(raw);
      if (!parsed.success)
        throw new CepError(
          503,
          "Resposta de CEP inválida. Preencha o endereço manualmente.",
        );
      const p = parsed.data,
        address = {
          cep: p.cep,
          street: p.logradouro,
          neighborhood: p.bairro,
          city: p.localidade,
          state: p.uf,
        };
      if (fetcher === fetch) {
        if (cache.size >= 100) cache.delete(cache.keys().next().value!);
        cache.set(cep, { address, expires: Date.now() + 6 * 3600000 });
      }
      return address;
    } catch (error) {
      if (error instanceof CepError) throw error;
      if (signal?.aborted) throw new CepError(499, "Consulta cancelada.");
      if (attempt === 1)
        throw new CepError(
          503,
          "A consulta demorou demais. Preencha o endereço manualmente.",
        );
    }
  }
  throw new CepError(503, "Consulta indisponível.");
}
