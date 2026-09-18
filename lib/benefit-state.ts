import type { UserBenefitRow } from "@/lib/db/account";
import {
  annualizedValue,
  currentPeriod,
  daysUntil,
  nextResetAt,
} from "@/lib/periods";

export type UsageRow = {
  benefitId: string;
  period: string;
  status: string;
  savedAmount?: number | null;
};

export type BenefitState = {
  annualValue: number;
  benefit: UserBenefitRow;
  daysLeft: number | null;
  irrelevant: boolean;
  period: string | null;
  resetAt: Date | null;
  used: boolean;
};

export function computeBenefitStates(
  benefits: UserBenefitRow[],
  usage: UsageRow[],
  now = new Date()
): BenefitState[] {
  const used = new Set(
    usage
      .filter((row) => row.status === "used")
      .map((row) => `${row.benefitId}:${row.period}`)
  );
  const irrelevant = new Set(
    usage
      .filter((row) => row.status === "not_relevant")
      .map((row) => `${row.benefitId}:${row.period}`)
  );

  return benefits.map((benefit) => {
    const period = currentPeriod(benefit.resetFrequency, now);
    const key = period ? `${benefit.id}:${period}` : null;
    const resetAt = nextResetAt(benefit.resetFrequency, now);
    return {
      annualValue: annualizedValue(benefit.monetaryValue, benefit.valuePeriod),
      benefit,
      daysLeft: resetAt ? daysUntil(resetAt, now) : null,
      irrelevant: key ? irrelevant.has(key) : false,
      period,
      resetAt,
      used: key ? used.has(key) : false,
    };
  });
}

export function totalConfirmedSavings(usage: UsageRow[]): number {
  return usage.reduce(
    (total, row) =>
      total + (row.status === "used" ? (row.savedAmount ?? 0) : 0),
    0
  );
}
