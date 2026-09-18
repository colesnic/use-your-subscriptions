import { z } from "zod";
import { isSameOrigin } from "@/lib/auth/origin";
import { consumeVerificationToken } from "@/lib/auth/verification";

const bodySchema = z.object({ token: z.string().min(10).max(200) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const userId = await consumeVerificationToken(body.token);
  if (!userId) {
    return Response.json(
      { error: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  return Response.json({ ok: true });
}
