import { sameOrigin, json, fail } from "@/lib/http";
import { signOut } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await signOut();
    return json({ success: true });
  } catch (error) {
    return fail(error);
  }
}
