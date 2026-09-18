export type ResetFrequency =
  | "none"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "calendar_year"
  | "cardmember_year";

export function currentPeriod(
  resetFrequency: string | null | undefined,
  now = new Date()
): string | null {
  const year = now.getUTCFullYear();
  switch (resetFrequency) {
    case "monthly":
      return `${year}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    case "quarterly":
      return `${year}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
    case "semiannual":
      return `${year}-H${now.getUTCMonth() < 6 ? 1 : 2}`;
    case "annual":
    case "calendar_year":
    case "cardmember_year":
      return `${year}`;
    default:
      return null;
  }
}

export function nextResetAt(
  resetFrequency: string | null | undefined,
  now = new Date()
): Date | null {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  switch (resetFrequency) {
    case "monthly":
      return new Date(Date.UTC(year, month + 1, 1));
    case "quarterly":
      return new Date(Date.UTC(year, Math.floor(month / 3) * 3 + 3, 1));
    case "semiannual":
      return month < 6
        ? new Date(Date.UTC(year, 6, 1))
        : new Date(Date.UTC(year + 1, 0, 1));
    case "annual":
    case "calendar_year":
      return new Date(Date.UTC(year + 1, 0, 1));
    default:
      return null;
  }
}

export function daysUntil(date: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

/**
 * Annualized value for recurring credits. per_use and one_time benefits are
 * excluded (return 0) so they never inflate the recurring annual total.
 */
export function annualizedValue(
  monetaryValue: number | null | undefined,
  valuePeriod: string | null | undefined
): number {
  if (!monetaryValue) {
    return 0;
  }
  switch (valuePeriod) {
    case "monthly":
      return monetaryValue * 12;
    case "quarterly":
      return monetaryValue * 4;
    case "semiannual":
      return monetaryValue * 2;
    case "annual":
      return monetaryValue;
    default:
      return 0;
  }
}

export function formatUsd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
