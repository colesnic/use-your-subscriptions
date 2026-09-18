"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/server";
import {
  addUserCustomProduct,
  deleteUserCustomProduct,
  getBenefitById,
  setBenefitUsage,
  setUserProviders,
} from "@/lib/db/account";
import { currentPeriod } from "@/lib/periods";

function clean(value: string | undefined | null, max: number) {
  return value?.trim().slice(0, max) ?? null;
}

export async function saveProviders(providerIds: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  await setUserProviders(user.id, providerIds.slice(0, 500));
  revalidatePath("/dashboard");
  revalidatePath("/benefits");
  revalidatePath("/setup");
}

export async function addCustomProduct(input: {
  name: string;
  provider?: string;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  const name = clean(input.name, 120);
  if (!name) {
    throw new Error("Name is required");
  }
  await addUserCustomProduct({
    name,
    notes: clean(input.notes, 500),
    provider: clean(input.provider, 120),
    userId: user.id,
  });
  revalidatePath("/setup");
  revalidatePath("/profile");
}

export async function removeCustomProduct(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  await deleteUserCustomProduct(user.id, id);
  revalidatePath("/setup");
  revalidatePath("/profile");
}

export async function markBenefit(input: {
  benefitId: string;
  status: "available" | "used" | "not_relevant";
  savedAmount?: number | null;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  const benefit = await getBenefitById(input.benefitId);
  if (!benefit) {
    throw new Error("Benefit not found");
  }
  const period = currentPeriod(benefit.resetFrequency) ?? "all";
  await setBenefitUsage({
    benefitId: input.benefitId,
    period,
    savedAmount: input.savedAmount ?? null,
    status: input.status,
    userId: user.id,
  });
  revalidatePath("/dashboard");
  revalidatePath("/benefits");
  revalidatePath("/unused");
  revalidatePath(`/benefits/${input.benefitId}`);
}
