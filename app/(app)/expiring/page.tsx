import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import { computeBenefitStates } from "@/lib/benefit-state";
import { getUserBenefits, getUserUsage } from "@/lib/db/account";

export default async function ExpiringPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [benefits, usage] = await Promise.all([
    getUserBenefits(user.id),
    getUserUsage(user.id),
  ]);

  const expiring = computeBenefitStates(benefits, usage)
    .filter(
      (state) =>
        !(state.used || state.irrelevant) &&
        state.resetAt !== null &&
        state.daysLeft !== null &&
        state.daysLeft <= 90
    )
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

  const groups = [
    {
      items: expiring.filter((s) => (s.daysLeft ?? 999) <= 7),
      label: "This week",
    },
    {
      items: expiring.filter(
        (s) => (s.daysLeft ?? 999) > 7 && (s.daysLeft ?? 999) <= 30
      ),
      label: "This month",
    },
    {
      items: expiring.filter((s) => (s.daysLeft ?? 999) > 30),
      label: "This quarter",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium">
          Use these before they&apos;re gone
        </h1>
        <p className="text-muted-foreground text-sm">
          Benefits that reset or expire in the next 90 days.
        </p>
      </header>

      {expiring.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-serif text-lg font-medium">
            Nothing urgent right now
          </h2>
          <p className="text-muted-foreground text-sm">
            <Link className="underline" href="/benefits">
              Browse all benefits
            </Link>{" "}
            to find something to use.
          </p>
        </div>
      ) : (
        groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section className="flex flex-col gap-3" key={group.label}>
              <h2 className="font-serif text-lg font-medium">{group.label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((state) => (
                  <Link
                    className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-foreground/20"
                    href={`/benefits/${state.benefit.id}`}
                    key={state.benefit.id}
                  >
                    <span className="font-serif text-[15px] font-medium">
                      {state.benefit.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {state.benefit.providerName}
                      {state.benefit.value ? ` · ${state.benefit.value}` : ""}
                    </span>
                    <span className="mt-auto rounded-full bg-muted px-2 py-0.5 text-xs">
                      {state.daysLeft} day
                      {state.daysLeft === 1 ? "" : "s"} left
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
