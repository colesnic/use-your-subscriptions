import { eq } from "drizzle-orm";
import { z } from "zod";
import { isSameOrigin } from "@/lib/auth/origin";
import { isAuthRateLimited } from "@/lib/auth/rate-limit";
import { createPasswordResetToken } from "@/lib/auth/verification";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import { appBaseUrl, sendEmail } from "@/lib/email";

const bodySchema = z.object({ email: z.email().max(200) });

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
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const email = body.email.trim().toLowerCase();
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (found) {
    const token = await createPasswordResetToken(found.id);
    const url = `${appBaseUrl(new URL(request.url).origin)}/reset-password?token=${token}`;
    await sendEmail({
      subject: "Reset your MembershipMaxxing password",
      text: `Reset your password using this link (expires in 1 hour):\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
      to: email,
    });
  }

  return Response.json({ ok: true });
}
