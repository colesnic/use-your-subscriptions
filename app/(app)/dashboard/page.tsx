import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import {
  getUserBenefits,
  getUserProviderIds,
  getUserUsage,
} from "@/lib/db/account";
import {
  annualizedValue,
  currentPeriod,
  daysUntil,
  formatUsd,
  nextResetAt,
} from "@/lib/periods";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [providerIds, benefits, usage] = await Promise.all([
    getUserProviderIds(user.id),
    getUserBenefits(user.id),
    getUserUsage(user.id),
  ]);

  const usedKeys = new Set(
    usage
      .filter((row) => row.status === "used")
      .map((row) => `${row.benefitId}:${row.period}`)
  );

  const now = new Date();
  const annualValue = benefits.reduce(
    (total, item) =>
      total + annualizedValue(item.monetaryValue, item.valuePeriod),
    0
  );

  const recommendations = benefits
    .map((item) => {
      const period = currentPeriod(item.resetFrequency, now);
      const resetAt = nextResetAt(item.resetFrequency, now);
      const isUsed = period ? usedKeys.has(`${item.id}:${period}`) : false;
      return { isUsed, item, period, resetAt };
    })
    .filter(
      (entry) =>
        !entry.isUsed &&
        entry.item.monetaryValue &&
        entry.resetAt &&
        daysUntil(entry.resetAt, now) <= 45
    )
    .sort((a, b) => {
      const aDays = a.resetAt ? daysUntil(a.resetAt, now) : 999;
      const bDays = b.resetAt ? daysUntil(b.resetAt, now) : 999;
      if (aDays !== bDays) {
        return aDays - bDays;
      }
      return (
        annualizedValue(b.item.monetaryValue, b.item.valuePeriod) -
        annualizedValue(a.item.monetaryValue, a.item.valuePeriod)
      );
    })
    .slice(0, 6);

  const useSoonCount = recommendations.filter(
    (entry) => entry.resetAt && daysUntil(entry.resetAt, now) <= 14
  ).length;

  const stats = [
    { label: "Products connected", value: String(providerIds.length) },
    { label: "Benefits available", value: String(benefits.length) },
    { label: "Use soon", value: String(useSoonCount) },
    {
      label: "Potential annual value",
      value: annualValue > 0 ? formatUsd(annualValue) : "—",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium">Your Benefits</h1>
        <p className="text-muted-foreground text-sm">
          What you have, and what you should use.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-4"
            key={stat.label}
          >
            <span className="font-serif text-2xl font-medium">
              {stat.value}
            </span>
            <span className="text-muted-foreground text-xs">{stat.label}</span>
          </div>
        ))}
      </section>

      {providerIds.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-serif text-lg font-medium">
            Add the things you already pay for
          </h2>
          <p className="text-muted-foreground text-sm">
            We&apos;ll find the benefits hidden inside them.
          </p>
          <Link
            className="rounded-lg bg-foreground px-4 py-2 text-background text-sm"
            href="/setup"
          >
            Add my memberships
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-lg font-medium">
            Recommended right now
          </h2>
          {recommendations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing urgent right now.{" "}
              <Link className="underline" href="/benefits">
                Browse all benefits
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendations.map(({ item, resetAt }) => (
                <Link
                  className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-foreground/20"
                  href={`/benefits/${item.id}`}
                  key={item.id}
                >
                  <span className="font-serif text-[15px] font-medium">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {item.providerName}
                    {resetAt
                      ? ` · ${daysUntil(resetAt, now)} days left this period`
                      : ""}
                  </span>
                  {item.value ? (
                    <span className="text-sm">{item.value}</span>
                  ) : null}
                  <span className="mt-auto text-muted-foreground text-xs underline">
                    View benefit
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-medium">Explore</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-lg border border-border/60 px-3 py-1.5"
            href="/benefits"
          >
            All benefits
          </Link>
          <Link
            className="rounded-lg border border-border/60 px-3 py-1.5"
            href="/benefits?filter=expiring"
          >
            Expiring soon
          </Link>
          <Link
            className="rounded-lg border border-border/60 px-3 py-1.5"
            href="/benefits?filter=unused"
          >
            Unused
          </Link>
          <Link
            className="rounded-lg border border-border/60 px-3 py-1.5"
            href="/chat"
          >
            Ask a question
          </Link>
        </div>
      </section>
    </div>
  );
}
