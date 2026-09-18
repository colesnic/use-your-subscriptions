import { getCurrentUser } from "@/lib/auth/server";
import { getUserBenefits, getUserProviderIds } from "@/lib/db/account";
import { annualizedValue } from "@/lib/periods";
import { ShareCard } from "./share-card";

export default async function SharePage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [providerIds, benefits] = await Promise.all([
    getUserProviderIds(user.id),
    getUserBenefits(user.id),
  ]);

  const annualValue = benefits.reduce(
    (total, benefit) =>
      total + annualizedValue(benefit.monetaryValue, benefit.valuePeriod),
    0
  );
  const usefulBenefits = benefits.filter(
    (benefit) =>
      Boolean(benefit.monetaryValue) ||
      benefit.activationRequired ||
      Boolean(benefit.resetFrequency && benefit.resetFrequency !== "none")
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium">Share your savings</h1>
        <p className="text-muted-foreground text-sm">
          This card only shows totals — never which products you own.
        </p>
      </header>
      <ShareCard
        annualValue={annualValue}
        benefits={usefulBenefits}
        memberships={providerIds.length}
      />
    </div>
  );
}
