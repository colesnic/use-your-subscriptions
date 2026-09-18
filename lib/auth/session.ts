import { eq, getTableColumns } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { session, type User, user } from "@/lib/db/schema";
import { hashToken, randomToken } from "./tokens";

export const SESSION_COOKIE = "mm_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

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
  const token = randomToken(32);
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
    .select({ expiresAt: session.expiresAt, user: getTableColumns(user) })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(session).where(eq(session.id, id));
    return null;
  }

  return row.user;
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
