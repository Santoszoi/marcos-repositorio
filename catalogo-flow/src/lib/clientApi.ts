export async function readApi<T>(response: Response): Promise<T> {
  const data: unknown = await response.json();
  if (!response.ok) {
    const error =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Não foi possível concluir. Tente novamente.";
    throw new Error(error);
  }
  return data as T;
}
