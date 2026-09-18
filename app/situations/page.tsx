import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SITUATION_GROUPS, SITUATIONS } from "@/lib/situations";

export default function SituationsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-24">
        <header className="flex flex-col gap-2 pt-10 text-center">
          <h1 className="font-serif text-3xl font-medium sm:text-4xl">
            Browse situations
          </h1>
          <p className="text-muted-foreground text-sm">
            Start from what you&apos;re doing, not from a benefit name.
          </p>
        </header>

        {SITUATION_GROUPS.map((group) => {
          const items = SITUATIONS.filter(
            (situation) => situation.group === group
          );
          if (items.length === 0) {
            return null;
          }
          return (
            <section className="flex flex-col gap-3" key={group}>
              <h2 className="font-serif text-lg font-medium">{group}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((situation) => (
                  <Link
                    className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-foreground/20"
                    href={`/situations/${situation.slug}`}
                    key={situation.slug}
                  >
                    <span className="font-serif text-[15px] font-medium">
                      {situation.heading}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {situation.subheading}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
