import { sameOrigin, json, fail } from "@/lib/http";
import { demoUser } from "@/lib/auth";
import { merchant, ownerStore } from "@/lib/repository";
import { rateLimit } from "@/lib/rateLimit";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, "demo", 20, 3600);
    const user = await demoUser(request);
    return json({
      user: merchant(user),
      store: (await ownerStore(user.id))?.store,
    });
  } catch (error) {
    return fail(error);
  }
}
