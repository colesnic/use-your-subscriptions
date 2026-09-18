import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  googleConfigured,
  upsertGoogleUser,
} from "@/lib/auth/google";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { origin } = url;

  const store = await cookies();
  const storedState = store.get("mm_oauth_state")?.value;
  const verifier = store.get("mm_oauth_verifier")?.value;
  store.delete("mm_oauth_state");
  store.delete("mm_oauth_verifier");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (
    !(
      googleConfigured() &&
      !error &&
      code &&
      state &&
      storedState &&
      state === storedState &&
      verifier
    )
  ) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  try {
    const tokens = await exchangeGoogleCode({
      code,
      codeVerifier: verifier,
      origin,
    });
    const profile = await fetchGoogleProfile(tokens.access_token);
    if (!profile.email) {
      throw new Error("google profile missing email");
    }

    const target = await upsertGoogleUser(profile);
    const { token, expiresAt } = await createSession(target.id, {
      ip: request.headers.get("cf-connecting-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set(SESSION_COOKIE, token, {
      expires: expiresAt,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (oauthError) {
    console.error("google oauth failed", oauthError);
    return NextResponse.redirect(`${origin}/login?error=google`);
  }
}
