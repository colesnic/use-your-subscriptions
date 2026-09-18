import "server-only";

import { and, eq, getTableColumns } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { account, type User, user } from "@/lib/db/schema";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function googleRedirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export function googleAuthUrl({
  origin,
  state,
  codeChallenge,
}: {
  origin: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(GOOGLE_AUTH);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", googleRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode({
  code,
  origin,
  codeVerifier,
}: {
  code: string;
  origin: string;
  codeVerifier: string;
}) {
  const response = await fetch(GOOGLE_TOKEN, {
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: googleRedirectUri(origin),
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`google token exchange failed (${response.status})`);
  }

  return (await response.json()) as { access_token: string };
}

export type GoogleProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleProfile(
  accessToken: string
): Promise<GoogleProfile> {
  const response = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`google userinfo failed (${response.status})`);
  }

  return (await response.json()) as GoogleProfile;
}

export async function upsertGoogleUser(profile: GoogleProfile): Promise<User> {
  const [linked] = await db
    .select(getTableColumns(user))
    .from(account)
    .innerJoin(user, eq(account.userId, user.id))
    .where(
      and(
        eq(account.provider, "google"),
        eq(account.providerAccountId, profile.sub)
      )
    )
    .limit(1);

  if (linked) {
    return linked;
  }

  const email = profile.email?.trim().toLowerCase();
  let target: User | undefined;
  if (email) {
    const [byEmail] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    target = byEmail;
  }

  if (!target) {
    const [created] = await db
      .insert(user)
      .values({
        email: email ?? `${profile.sub}@google.local`,
        emailVerified: profile.email_verified === true,
        image: profile.picture ?? null,
        name: profile.name ?? null,
      })
      .returning();
    target = created;
  } else if (profile.email_verified === true && !target.emailVerified) {
    const [updated] = await db
      .update(user)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(user.id, target.id))
      .returning();
    target = updated;
  }

  await db.insert(account).values({
    provider: "google",
    providerAccountId: profile.sub,
    userId: target.id,
  });

  return target;
}
