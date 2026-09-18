import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import {
  getBenefitById,
  getUserProviderIds,
  getUserUsage,
} from "@/lib/db/account";
import { currentPeriod, nextResetAt } from "@/lib/periods";
import { BenefitActions } from "./benefit-actions";

const FREQUENCY_LABELS: Record<string, string> = {
  annual: "Annual",
  monthly: "Monthly",
  none: "One-time",
  quarterly: "Quarterly",
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-border/50 border-b py-3 last:border-0">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm leading-relaxed">{children}</span>
    </div>
  );
}

export default async function BenefitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [benefit, providerIds, usage] = await Promise.all([
    getBenefitById(slug),
    getUserProviderIds(user.id),
    getUserUsage(user.id),
  ]);

  if (!benefit) {
    notFound();
  }

  const period = currentPeriod(benefit.resetFrequency);
  const resetAt = nextResetAt(benefit.resetFrequency);
  const usageRow = period
    ? usage.find((row) => row.benefitId === benefit.id && row.period === period)
    : undefined;
  const sourceUrl =
    benefit.officialUrl ?? benefit.sourceUrl ?? benefit.providerWebsite;
  const owned = providerIds.includes(benefit.providerId);

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          className="text-muted-foreground text-xs underline"
          href="/benefits"
        >
          ← All benefits
        </Link>
        <h1 className="font-serif text-3xl font-medium">{benefit.title}</h1>
        <p className="text-muted-foreground text-sm">
          {benefit.providerName}
          {owned ? "" : " · not in your products"}
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card px-4">
        {benefit.value ? <Row label="Value">{benefit.value}</Row> : null}
        {benefit.resetFrequency && benefit.resetFrequency !== "none" ? (
          <Row label="Frequency">
            {FREQUENCY_LABELS[benefit.resetFrequency] ?? benefit.resetFrequency}
            {resetAt
              ? ` · resets ${resetAt.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })}`
              : ""}
          </Row>
        ) : null}
        <Row label="What it does">{benefit.details}</Row>
        {benefit.howToUse ? (
          <Row label="How to use it">{benefit.howToUse}</Row>
        ) : null}
        {benefit.restrictions ? (
          <Row label="Restrictions">{benefit.restrictions}</Row>
        ) : null}
        {benefit.lastVerifiedAt ? (
          <Row label="Last verified">
            {benefit.lastVerifiedAt.toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              timeZone: "UTC",
              year: "numeric",
            })}
          </Row>
        ) : null}
        {sourceUrl ? (
          <Row label="Official source">
            <a
              className="underline"
              href={sourceUrl}
              rel="noreferrer noopener"
              target="_blank"
            >
              {sourceUrl}
            </a>
          </Row>
        ) : null}
      </div>

      <BenefitActions
        benefitId={benefit.id}
        status={usageRow?.status ?? null}
        suggestedValue={benefit.monetaryValue}
      />
    </article>
  );
}
