import { eq } from "drizzle-orm";
import { z } from "zod";
import { isSameOrigin } from "@/lib/auth/origin";
import { hashPassword } from "@/lib/auth/password";
import { isAuthRateLimited } from "@/lib/auth/rate-limit";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

const bodySchema = z.object({
  email: z.email().max(200),
  name: z.string().trim().max(80).optional(),
  password: z.string().min(8).max(200),
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
      {
        error: "Enter a valid email and a password of at least 8 characters.",
      },
      { status: 400 }
    );
  }

  const email = body.email.trim().toLowerCase();

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing.length > 0) {
    return Response.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(body.password);
  const [created] = await db
    .insert(user)
    .values({
      email,
      name: body.name?.trim() || null,
      password: passwordHash,
    })
    .returning();

  const { token, expiresAt } = await createSession(created.id, {
    ip,
    userAgent: request.headers.get("user-agent"),
  });
  await setSessionCookie(token, expiresAt);

  return Response.json(
    { user: { email: created.email, id: created.id, name: created.name } },
    { status: 201 }
  );
}
