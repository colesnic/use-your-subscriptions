import "server-only";

import { and, asc, eq, getTableColumns, inArray } from "drizzle-orm";
import { db } from "./client";
import {
  type Benefit,
  benefit,
  provider,
  userBenefitUsage,
  userCustomProduct,
  userSubscription,
} from "./schema";

export async function getUserProviderIds(userId: string) {
  const rows = await db
    .select({ providerId: userSubscription.providerId })
    .from(userSubscription)
    .where(eq(userSubscription.userId, userId));
  return rows.map((row) => row.providerId);
}

export async function setUserProviders(userId: string, providerIds: string[]) {
  const unique = [...new Set(providerIds)];
  await db.delete(userSubscription).where(eq(userSubscription.userId, userId));
  if (unique.length > 0) {
    await db
      .insert(userSubscription)
      .values(unique.map((providerId) => ({ providerId, userId })));
  }
}

export async function getUserCustomProducts(userId: string) {
  return await db
    .select()
    .from(userCustomProduct)
    .where(eq(userCustomProduct.userId, userId))
    .orderBy(asc(userCustomProduct.createdAt));
}

export async function addUserCustomProduct({
  userId,
  name,
  provider: providerName,
  notes,
}: {
  userId: string;
  name: string;
  provider?: string | null;
  notes?: string | null;
}) {
  const [row] = await db
    .insert(userCustomProduct)
    .values({
      name,
      notes: notes ?? null,
      provider: providerName ?? null,
      userId,
    })
    .returning();
  return row;
}

export async function deleteUserCustomProduct(userId: string, id: string) {
  await db
    .delete(userCustomProduct)
    .where(
      and(eq(userCustomProduct.userId, userId), eq(userCustomProduct.id, id))
    );
}

export type UserBenefitRow = Benefit & {
  providerName: string;
  providerSlug: string;
  providerWebsite: string | null;
};

export async function getUserBenefits(
  userId: string
): Promise<UserBenefitRow[]> {
  const providerIds = await getUserProviderIds(userId);
  if (providerIds.length === 0) {
    return [];
  }

  return await db
    .select({
      ...getTableColumns(benefit),
      providerName: provider.name,
      providerSlug: provider.slug,
      providerWebsite: provider.website,
    })
    .from(benefit)
    .innerJoin(provider, eq(benefit.providerId, provider.id))
    .where(inArray(benefit.providerId, providerIds))
    .orderBy(asc(benefit.title));
}

export async function getBenefitById(id: string) {
  const [row] = await db
    .select({
      ...getTableColumns(benefit),
      providerName: provider.name,
      providerSlug: provider.slug,
      providerWebsite: provider.website,
    })
    .from(benefit)
    .innerJoin(provider, eq(benefit.providerId, provider.id))
    .where(eq(benefit.id, id))
    .limit(1);
  return row ?? null;
}

export async function getUserUsage(userId: string) {
  return await db
    .select()
    .from(userBenefitUsage)
    .where(eq(userBenefitUsage.userId, userId));
}

export async function setBenefitUsage({
  userId,
  benefitId,
  period,
  status,
  savedAmount,
}: {
  userId: string;
  benefitId: string;
  period: string;
  status: "available" | "used" | "not_relevant";
  savedAmount?: number | null;
}) {
  await db
    .insert(userBenefitUsage)
    .values({
      benefitId,
      period,
      savedAmount: savedAmount ?? null,
      status,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        savedAmount: savedAmount ?? null,
        status,
        updatedAt: new Date(),
      },
      target: [
        userBenefitUsage.userId,
        userBenefitUsage.benefitId,
        userBenefitUsage.period,
      ],
    });
}
