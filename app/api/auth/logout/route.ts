import { isSameOrigin } from "@/lib/auth/origin";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  await destroySession();
  return Response.json({ ok: true });
}
