import { NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured } from "@/lib/auth/google";
import { pkceChallenge, randomToken } from "@/lib/auth/tokens";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=google_unconfigured`);
  }

  const state = randomToken(16);
  const verifier = randomToken(32);
  const codeChallenge = await pkceChallenge(verifier);

  const response = NextResponse.redirect(
    googleAuthUrl({ codeChallenge, origin, state })
  );
  const cookie = {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  response.cookies.set("mm_oauth_state", state, cookie);
  response.cookies.set("mm_oauth_verifier", verifier, cookie);
  return response;
}
