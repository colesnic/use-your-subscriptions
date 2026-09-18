import { isSameOrigin } from "@/lib/auth/origin";
import { getSessionUser } from "@/lib/auth/session";
import { createVerificationToken } from "@/lib/auth/verification";
import { appBaseUrl, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (user.emailVerified) {
    return Response.json({ ok: true });
  }

  const token = await createVerificationToken(user.id);
  const url = `${appBaseUrl(new URL(request.url).origin)}/verify-email?token=${token}`;
  await sendEmail({
    subject: "Verify your MembershipMaxxing email",
    text: `Confirm your email to finish setting up your account:\n\n${url}\n\nIf you did not create an account, you can ignore this email.`,
    to: user.email,
  });

  return Response.json({ ok: true });
}
