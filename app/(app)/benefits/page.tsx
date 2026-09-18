import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserBenefits, getUserUsage } from "@/lib/db/account";
import { currentPeriod, daysUntil, nextResetAt } from "@/lib/periods";
import { type BenefitCard, BenefitsBrowser } from "./benefits-browser";

export default async function BenefitsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [{ filter }, benefits, usage] = await Promise.all([
    searchParams,
    getUserBenefits(user.id),
    getUserUsage(user.id),
  ]);

  const now = new Date();
  const usedKeys = new Set(
    usage
      .filter((row) => row.status === "used")
      .map((row) => `${row.benefitId}:${row.period}`)
  );

  const cards: BenefitCard[] = benefits.map((item) => {
    const period = currentPeriod(item.resetFrequency, now);
    const resetAt = nextResetAt(item.resetFrequency, now);
    return {
      category: item.category,
      daysLeft: resetAt ? daysUntil(resetAt, now) : null,
      id: item.id,
      monetaryValue: item.monetaryValue,
      providerName: item.providerName,
      resetFrequency: item.resetFrequency,
      summary: item.summary,
      tags: item.tags ?? [],
      title: item.title,
      used: period ? usedKeys.has(`${item.id}:${period}`) : false,
      value: item.value,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium">Your benefits</h1>
        <p className="text-muted-foreground text-sm">
          Everything available through the products you selected.
        </p>
      </header>
      {benefits.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No products selected yet.{" "}
          <Link className="underline" href="/setup">
            Add your memberships
          </Link>{" "}
          to see your benefits.
        </p>
      ) : (
        <BenefitsBrowser benefits={cards} initialFilter={filter ?? "all"} />
      )}
    </div>
  );
}
