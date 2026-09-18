type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "MembershipMaxxing <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email] skipped (RESEND_API_KEY not set)\n  to: ${to}\n  subject: ${subject}\n  ${text}`
    );
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({ from, html, subject, text, to }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      console.error("[email] send failed", response.status);
      return { ok: false, skipped: false };
    }
    return { ok: true, skipped: false };
  } catch (error) {
    console.error("[email] send error", error);
    return { ok: false, skipped: false };
  }
}

export function appBaseUrl(origin: string | null) {
  return (process.env.APP_URL ?? origin ?? "http://localhost:3001").replace(
    /\/$/,
    ""
  );
}
