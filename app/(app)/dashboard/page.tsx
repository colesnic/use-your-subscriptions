import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import {
  type BenefitState,
  computeBenefitStates,
  totalConfirmedSavings,
} from "@/lib/benefit-state";
import {
  getUserBenefits,
  getUserProviderIds,
  getUserUsage,
} from "@/lib/db/account";
import { formatUsd } from "@/lib/periods";

type Recommendation = {
  daysLeft: number | null;
  id: string;
  priority: number;
  providerName: string;
  reason: string;
  score: number;
  title: string;
  value: string | null;
};

function toRecommendation(state: BenefitState): Recommendation | null {
  const { benefit, daysLeft, annualValue } = state;
  const recurring = Boolean(
    benefit.resetFrequency && benefit.resetFrequency !== "none"
  );

  let priority: number | null = null;
  let reason = "";

  if (recurring && daysLeft !== null && daysLeft <= 14) {
    priority = 1;
    reason = "Use before this period resets.";
  } else if (recurring && benefit.monetaryValue) {
    priority = 2;
    reason = "Recurring credit you have not used yet.";
  } else if (annualValue > 0) {
    priority = 3;
    reason = "High-value benefit in your profile.";
  } else if (benefit.activationRequired) {
    priority = 4;
    reason = "Needs activation to use.";
  } else if (
    benefit.tags?.some((tag) => tag === "credit" || tag === "insurance")
  ) {
    priority = 5;
    reason = "Commonly useful benefit you have not marked as used.";
  }

  if (priority === null) {
    return null;
  }

  return {
    daysLeft,
    id: benefit.id,
    priority,
    providerName: benefit.providerName,
    reason,
    score: annualValue,
    title: benefit.title,
    value: benefit.value ?? null,
  };
}

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

  const states = computeBenefitStates(benefits, usage);
  const annualValue = states.reduce((total, s) => total + s.annualValue, 0);
  const confirmedSavings = totalConfirmedSavings(usage);

  const candidates = states
    .filter((state) => !(state.used || state.irrelevant))
    .map(toRecommendation)
    .filter((entry): entry is Recommendation => entry !== null);

  const recommendations = candidates
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const aDays = a.daysLeft ?? 999;
      const bDays = b.daysLeft ?? 999;
      if (aDays !== bDays) {
        return aDays - bDays;
      }
      return b.score - a.score;
    })
    .slice(0, 6);

  const useSoonCount = states.filter(
    (state) =>
      !(state.used || state.irrelevant) &&
      state.daysLeft !== null &&
      state.daysLeft <= 14
  ).length;

  const stats = [
    { label: "Products connected", value: String(providerIds.length) },
    { label: "Benefits available", value: String(benefits.length) },
    { label: "Use soon", value: String(useSoonCount) },
    {
      label: "Potential annual benefit value",
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
      <p className="-mt-4 text-muted-foreground text-xs">
        Potential annual benefit value is based only on benefits with explicit
        dollar values. Actual value depends on usage.
      </p>

      {confirmedSavings > 0 ? (
        <section className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-5">
          <span className="text-muted-foreground text-xs">
            MembershipMaxxing has helped you use
          </span>
          <span className="font-serif text-3xl font-medium">
            {formatUsd(confirmedSavings)}
          </span>
          <span className="text-muted-foreground text-xs">
            in benefits, based on what you confirmed using.
          </span>
        </section>
      ) : null}

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
              {recommendations.map((entry) => (
                <Link
                  className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-foreground/20"
                  href={`/benefits/${entry.id}`}
                  key={entry.id}
                >
                  <span className="font-serif text-[15px] font-medium">
                    {entry.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {entry.providerName}
                    {entry.value ? ` · ${entry.value}` : ""}
                  </span>
                  <span className="text-sm">{entry.reason}</span>
                  {entry.daysLeft !== null && entry.daysLeft <= 30 ? (
                    <span className="text-muted-foreground text-xs">
                      Resets in {entry.daysLeft} day
                      {entry.daysLeft === 1 ? "" : "s"}.
                    </span>
                  ) : null}
                  <span className="mt-auto pt-1 text-muted-foreground text-xs underline">
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
            href="/expiring"
          >
            Expiring soon
          </Link>
          <Link
            className="rounded-lg border border-border/60 px-3 py-1.5"
            href="/unused"
          >
            Unused
          </Link>
          <Link
            className="rounded-lg border border-border/60 px-3 py-1.5"
            href="/share"
          >
            Share your savings
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
