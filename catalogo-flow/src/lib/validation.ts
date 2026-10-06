import { z } from "zod";
const password = z
  .string()
  .min(12, "Use pelo menos 12 caracteres.")
  .refine(
    (v) => new TextEncoder().encode(v).length <= 72,
    "Use no máximo 72 bytes na senha.",
  );
export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9_.-]{3,32}$/,
        "Use 3 a 32 letras, números, pontos ou sublinhados.",
      ),
    displayName: z.string().trim().min(2).max(60),
    password,
  })
  .strict();
export const loginSchema = z
  .object({
    username: z.string().trim().toLowerCase().min(1).max(32),
    password: z
      .string()
      .min(1)
      .max(72)
      .refine(
        (v) => new TextEncoder().encode(v).length <= 72,
        "Senha inválida.",
      ),
  })
  .strict();
export const checkoutSchema = z
  .object({
    storeSlug: z.string().regex(/^[a-z0-9-]{3,80}$/),
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1).max(80),
            quantity: z.number().int().min(1).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(30),
    customerName: z.string().trim().min(2).max(80),
    deliveryAddress: z.string().trim().max(300),
    fulfillment: z.enum(["delivery", "pickup"]),
    idempotencyKey: z.uuid(),
  })
  .strict()
  .refine(
    (v) => v.fulfillment !== "delivery" || v.deliveryAddress.length >= 8,
    { message: "Informe o endereço de entrega.", path: ["deliveryAddress"] },
  );
export const statusSchema = z
  .object({
    status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]),
  })
  .strict();
export const availabilitySchema = z.object({ available: z.boolean() }).strict();
export const settingsSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    whatsappNumber: z
      .string()
      .regex(
        /^$|^[1-9]\d{9,14}$/,
        "Informe país e DDD, usando apenas números.",
      ),
  })
  .strict();
