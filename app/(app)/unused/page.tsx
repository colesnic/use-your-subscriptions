import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import { computeBenefitStates } from "@/lib/benefit-state";
import { getUserBenefits, getUserUsage } from "@/lib/db/account";
import { UsageButtons } from "./usage-buttons";

export default async function UnusedPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [benefits, usage] = await Promise.all([
    getUserBenefits(user.id),
    getUserUsage(user.id),
  ]);

  const unused = computeBenefitStates(benefits, usage)
    .filter((state) => {
      if (state.used || state.irrelevant) {
        return false;
      }
      const recurring = Boolean(
        state.benefit.resetFrequency && state.benefit.resetFrequency !== "none"
      );
      return Boolean(
        state.benefit.monetaryValue ||
          recurring ||
          state.benefit.activationRequired
      );
    })
    .sort((a, b) => {
      if (b.annualValue !== a.annualValue) {
        return b.annualValue - a.annualValue;
      }
      const aActivation = a.benefit.activationRequired ? 1 : 0;
      const bActivation = b.benefit.activationRequired ? 1 : 0;
      if (aActivation !== bActivation) {
        return aActivation - bActivation;
      }
      return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
    });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium">
          Benefits you may be leaving on the table
        </h1>
        <p className="text-muted-foreground text-sm">
          Sorted by value, how easy they are to activate, and how soon they
          reset.
        </p>
      </header>

      {unused.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-serif text-lg font-medium">
            Nice — there&apos;s nothing obvious you&apos;re leaving unused
          </h2>
          <p className="text-muted-foreground text-sm">
            <Link className="underline" href="/benefits">
              Browse all benefits
            </Link>{" "}
            to review everything you have.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {unused.map((state) => (
            <div
              className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4"
              key={state.benefit.id}
            >
              <Link
                className="flex flex-col gap-1"
                href={`/benefits/${state.benefit.id}`}
              >
                <span className="font-serif text-[15px] font-medium">
                  {state.benefit.title}
                </span>
                <span className="text-muted-foreground text-xs">
                  {state.benefit.providerName}
                  {state.benefit.value ? ` · ${state.benefit.value}` : ""}
                </span>
              </Link>
              <span className="flex flex-wrap gap-1.5 text-xs">
                {state.benefit.activationRequired ? (
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Activation required
                  </span>
                ) : null}
                {state.daysLeft !== null && state.daysLeft <= 30 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {state.daysLeft} days left
                  </span>
                ) : null}
                {state.used ? null : (
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Not used
                  </span>
                )}
              </span>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <Link
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs"
                  href={`/benefits/${state.benefit.id}`}
                >
                  Use this benefit
                </Link>
                <UsageButtons benefitId={state.benefit.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
