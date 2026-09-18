import { eq } from "drizzle-orm";
import { z } from "zod";
import { isSameOrigin } from "@/lib/auth/origin";
import { hashPassword } from "@/lib/auth/password";
import { isAuthRateLimited } from "@/lib/auth/rate-limit";
import {
  consumePasswordResetToken,
  invalidateUserSessions,
} from "@/lib/auth/verification";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

const bodySchema = z.object({
  password: z.string().min(8).max(200),
  token: z.string().min(10).max(200),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = request.headers.get("cf-connecting-ip") ?? undefined;
  if (await isAuthRateLimited(ip)) {
    return Response.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Use a password of at least 8 characters." },
      { status: 400 }
    );
  }

  const userId = await consumePasswordResetToken(body.token);
  if (!userId) {
    return Response.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(body.password);
  await db
    .update(user)
    .set({ password: passwordHash, updatedAt: new Date() })
    .where(eq(user.id, userId));
  await invalidateUserSessions(userId);

  return Response.json({ ok: true });
}
