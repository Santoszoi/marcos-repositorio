export type ValidationRule = (
  value: unknown,
  data?: Readonly<Record<string, unknown>>,
) => string | null;
export type SchemaDefinition<T extends object> = {
  [K in keyof T]: readonly ValidationRule[];
};
export type ValidationErrors<T extends object> = { [K in keyof T]?: string };
export interface ValidationResult<T extends object> {
  isValid: boolean;
  errors: ValidationErrors<T>;
  formError?: string;
  unknownKeys: string[];
}
const empty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");
export const required =
  (message = "Este campo é obrigatório"): ValidationRule =>
  (value) =>
    empty(value) ? message : null;
export const isEmail =
  (message = "Informe um e-mail válido"): ValidationRule =>
  (value) =>
    empty(value)
      ? null
      : typeof value === "string" &&
          value.length <= 254 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? null
        : message;
export function minLength(
  min: number,
  message = `Use pelo menos ${min} caracteres`,
): ValidationRule {
  if (!Number.isInteger(min) || min < 0 || min > 10000)
    throw new Error("Limite mínimo inválido.");
  return (value) =>
    empty(value)
      ? null
      : typeof value === "string" && value.trim().length >= min
        ? null
        : message;
}
export function maxLength(
  max: number,
  message = `Use no máximo ${max} caracteres`,
): ValidationRule {
  if (!Number.isInteger(max) || max < 0 || max > 10000)
    throw new Error("Limite máximo inválido.");
  return (value) =>
    empty(value)
      ? null
      : typeof value === "string" && value.length <= max
        ? null
        : message;
}
export const securePassword =
  (message = "Use letras maiúsculas, minúsculas e um número"): ValidationRule =>
  (value) =>
    empty(value)
      ? null
      : typeof value === "string" &&
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\s\S]+$/.test(value)
        ? null
        : message;
export function numberRange(
  min: number,
  max: number,
  message = `Informe um número entre ${min} e ${max}`,
): ValidationRule {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max)
    throw new Error("Intervalo numérico inválido.");
  return (value) =>
    empty(value)
      ? null
      : typeof value === "number" &&
          Number.isFinite(value) &&
          value >= min &&
          value <= max
        ? null
        : message;
}
export const integer =
  (message = "Informe um número inteiro"): ValidationRule =>
  (value) =>
    empty(value)
      ? null
      : typeof value === "number" && Number.isInteger(value)
        ? null
        : message;
export function validateSchema<T extends object>(
  data: unknown,
  schema: SchemaDefinition<T>,
): ValidationResult<T> {
  const errors: ValidationErrors<T> = Object.create(null);
  const keys = Object.keys(schema) as Array<keyof T & string>;
  const blocked = new Set(["__proto__", "prototype", "constructor"]);
  if (
    keys.some((k) => blocked.has(k)) ||
    keys.some(
      (k) =>
        !Array.isArray(schema[k]) ||
        schema[k].some((rule) => typeof rule !== "function"),
    )
  )
    throw new Error("Definição de schema inválida.");
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    (Object.getPrototypeOf(data) !== Object.prototype &&
      Object.getPrototypeOf(data) !== null)
  )
    return {
      isValid: false,
      errors,
      formError: "A entrada deve ser um objeto simples.",
      unknownKeys: [],
    };
  const record = data as Record<string, unknown>;
  const keySet = new Set<string>(keys);
  const unknownKeys = Object.keys(record).filter(
    (key) => !keySet.has(key) || blocked.has(key),
  );
  for (const key of keys) {
    const value = Object.hasOwn(record, key) ? record[key] : undefined;
    for (const rule of schema[key]) {
      const message = rule(value, record);
      if (message !== null) {
        if (typeof message !== "string")
          throw new Error("Uma regra retornou um resultado inválido.");
        errors[key] = message;
        break;
      }
    }
  }
  return {
    isValid: !unknownKeys.length && !Object.keys(errors).length,
    errors,
    unknownKeys,
    ...(unknownKeys.length
      ? { formError: "A entrada contém campos que não pertencem ao schema." }
      : {}),
  };
}
export function parseJsonObject(source: string): unknown {
  if (source.length > 10000)
    throw new Error("Limite de 10.000 caracteres excedido.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("JSON inválido. Confira as aspas, vírgulas e chaves.");
  }
  return parsed;
}
// Input validation is not HTML sanitization, authentication, or a replacement for server validation.
