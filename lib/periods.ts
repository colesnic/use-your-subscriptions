export type ResetFrequency = "monthly" | "quarterly" | "annual" | "none";

export function currentPeriod(
  resetFrequency: string | null | undefined,
  now = new Date()
): string | null {
  switch (resetFrequency) {
    case "monthly":
      return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    case "quarterly":
      return `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
    case "annual":
      return `${now.getUTCFullYear()}`;
    default:
      return null;
  }
}

export function nextResetAt(
  resetFrequency: string | null | undefined,
  now = new Date()
): Date | null {
  switch (resetFrequency) {
    case "monthly":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    case "quarterly":
      return new Date(
        Date.UTC(
          now.getUTCFullYear(),
          Math.floor(now.getUTCMonth() / 3) * 3 + 3,
          1
        )
      );
    case "annual":
      return new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    default:
      return null;
  }
}

export function daysUntil(date: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

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
    default:
      return monetaryValue;
  }
}

export function formatUsd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
