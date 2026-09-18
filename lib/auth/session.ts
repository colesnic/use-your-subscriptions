import { and, eq, getTableColumns, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { session, type User, user } from "@/lib/db/schema";

export const SESSION_COOKIE = "mm_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/[=]+$/, "");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function cookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function createSession(
  userId: string,
  meta?: { ip?: string | null; userAgent?: string | null }
) {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const id = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(session).values({
    expiresAt,
    id,
    ip: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
    userId,
  });

  return { expiresAt, token };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set({
    ...cookieOptions(),
    expires: expiresAt,
    name: SESSION_COOKIE,
    value: token,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set({ ...cookieOptions(), maxAge: 0, name: SESSION_COOKIE, value: "" });
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const id = await hashToken(token);
  const [row] = await db
    .select(getTableColumns(user))
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(and(eq(session.id, id), gt(session.expiresAt, new Date())))
    .limit(1);

  return row ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const id = await hashToken(token);
    await db.delete(session).where(eq(session.id, id));
  }
  await clearSessionCookie();
}
