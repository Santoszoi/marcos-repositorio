import { checkoutSchema } from "@/lib/validation";
import { sameOrigin, readJson, json, fail, HttpError } from "@/lib/http";
import { getStore, orderFromRow } from "@/lib/repository";
import { db } from "@/lib/db";
import { digest } from "@/lib/crypto";
import { priceOrder, whatsappMessage, whatsappUrl } from "@/lib/checkout";
import { rateLimit } from "@/lib/rateLimit";
import type { Order } from "@/types/store";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, "checkout", 15, 60);
    const body = checkoutSchema.parse(await readJson(request));
    const result = await getStore(body.storeSlug);
    if (!result || result.store.id === "showcase")
      throw new HttpError(
        404,
        "Abra uma loja de demonstração antes de finalizar.",
      );
    const requestHash = await digest(JSON.stringify(body));
    const findExisting = () =>
      db()
        .prepare(
          "SELECT * FROM orders WHERE store_id = ? AND idempotency_key = ?",
        )
        .bind(result.store.id, body.idempotencyKey)
        .first<Record<string, unknown>>();
    function response(order: Order) {
      const message = whatsappMessage(order, result!.store);
      return json({
        success: true,
        order,
        message,
        redirectUrl: whatsappUrl(result!.store.whatsappNumber, message),
        simulated: true,
      });
    }
    const existing = await findExisting();
    if (existing) {
      if (existing.request_hash !== requestHash)
        throw new HttpError(
          409,
          "Esta tentativa já foi usada para outro pedido.",
        );
      return response(orderFromRow(existing));
    }
    let price;
    try {
      price = priceOrder(body.items, result.products, body.fulfillment);
    } catch (error) {
      throw new HttpError(409, (error as Error).message);
    }
    const order: Order = {
      id: crypto.randomUUID(),
      customerName: body.customerName,
      deliveryAddress:
        body.fulfillment === "delivery"
          ? body.deliveryAddress
          : "Retirada no local",
      fulfillment: body.fulfillment,
      ...price,
      status: "new",
      createdAt: Date.now(),
    };
    try {
      await db()
        .prepare(
          "INSERT INTO orders (id,store_id,idempotency_key,request_hash,customer_name,delivery_address,fulfillment,items_json,total_cents,delivery_fee_cents,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          order.id,
          result.store.id,
          body.idempotencyKey,
          requestHash,
          order.customerName,
          order.deliveryAddress,
          order.fulfillment,
          JSON.stringify(order.items),
          order.totalCents,
          order.deliveryFeeCents,
          order.status,
          order.createdAt,
        )
        .run();
    } catch (error) {
      const raced = await findExisting();
      if (raced?.request_hash === requestHash)
        return response(orderFromRow(raced));
      throw error;
    }
    return response(order);
  } catch (error) {
    return fail(error);
  }
}
