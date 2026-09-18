import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  passwordResetToken,
  session,
  user,
  verificationToken,
} from "@/lib/db/schema";
import { hashToken, randomToken } from "./tokens";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
const RESET_TTL_MS = 1000 * 60 * 60;

export async function createVerificationToken(userId: string) {
  const token = randomToken(32);
  const id = await hashToken(token);
  await db
    .delete(verificationToken)
    .where(eq(verificationToken.userId, userId));
  await db.insert(verificationToken).values({
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    id,
    userId,
  });
  return token;
}

export async function consumeVerificationToken(token: string) {
  const id = await hashToken(token);
  const [row] = await db
    .select()
    .from(verificationToken)
    .where(eq(verificationToken.id, id))
    .limit(1);
  if (!row) {
    return null;
  }
  await db.delete(verificationToken).where(eq(verificationToken.id, id));
  if (row.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  await db
    .update(user)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(user.id, row.userId));
  return row.userId;
}

export async function createPasswordResetToken(userId: string) {
  const token = randomToken(32);
  const id = await hashToken(token);
  await db
    .delete(passwordResetToken)
    .where(eq(passwordResetToken.userId, userId));
  await db.insert(passwordResetToken).values({
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
    id,
    userId,
  });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const id = await hashToken(token);
  const [row] = await db
    .select()
    .from(passwordResetToken)
    .where(eq(passwordResetToken.id, id))
    .limit(1);
  if (!row) {
    return null;
  }
  await db.delete(passwordResetToken).where(eq(passwordResetToken.id, id));
  if (row.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return row.userId;
}

export async function invalidateUserSessions(userId: string) {
  await db.delete(session).where(eq(session.userId, userId));
}
