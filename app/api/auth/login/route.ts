import { eq } from "drizzle-orm";
import { z } from "zod";
import { isSameOrigin } from "@/lib/auth/origin";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { isAuthRateLimited } from "@/lib/auth/rate-limit";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

const bodySchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

const INVALID = "Incorrect email or password.";

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
    return Response.json({ error: INVALID }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!found?.password) {
    await burnPasswordCheck(body.password);
    return Response.json({ error: INVALID }, { status: 401 });
  }

  if (!(await verifyPassword(body.password, found.password))) {
    return Response.json({ error: INVALID }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(found.id, {
    ip,
    userAgent: request.headers.get("user-agent"),
  });
  await setSessionCookie(token, expiresAt);

  return Response.json({
    user: { email: found.email, id: found.id, name: found.name },
  });
}
