import {
  required,
  isEmail,
  minLength,
  maxLength,
  securePassword,
  numberRange,
  integer,
} from "./schemaValidator";
import type { SchemaDefinition } from "./schemaValidator";
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  age: number;
}
export interface SchemaOptions {
  nameMin: number;
  passwordMin: number;
  emailFormat: boolean;
  passwordPolicy: boolean;
}
export const defaultOptions: SchemaOptions = {
  nameMin: 3,
  passwordMin: 12,
  emailFormat: true,
  passwordPolicy: true,
};
export function buildRegistrationSchema(
  options: SchemaOptions,
): SchemaDefinition<RegistrationData> {
  return {
    name: [required(), minLength(options.nameMin), maxLength(120)],
    email: [
      required(),
      ...(options.emailFormat ? [isEmail()] : []),
      maxLength(254),
    ],
    password: [
      required(),
      minLength(options.passwordMin),
      maxLength(72),
      ...(options.passwordPolicy ? [securePassword()] : []),
    ],
    age: [required(), integer(), numberRange(18, 120)],
  };
}
export const validExample: RegistrationData = {
  name: "Marcos Exemplo",
  email: "marcos@example.com",
  password: "ExemploSeguro2026",
  age: 28,
};
export const invalidExample = {
  name: "  ",
  email: "email-invalido",
  password: "abc",
  age: 16,
};
