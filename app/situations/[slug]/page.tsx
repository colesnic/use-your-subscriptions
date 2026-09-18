import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/marketing/site-header";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserBenefits } from "@/lib/db/account";
import { getSituation } from "@/lib/situations";

export default async function SituationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const situation = getSituation(slug);
  if (!situation) {
    notFound();
  }

  const user = await getCurrentUser();
  const benefits = user ? await getUserBenefits(user.id) : [];

  const relevant = benefits.filter((benefit) => {
    if (situation.categories.includes(benefit.category)) {
      return true;
    }
    const haystack =
      `${benefit.title} ${benefit.summary} ${(benefit.tags ?? []).join(" ")}`.toLowerCase();
    return situation.keywords.some((keyword) => haystack.includes(keyword));
  });

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pb-24">
        <header className="flex flex-col gap-2 pt-10">
          <h1 className="font-serif text-3xl font-medium sm:text-4xl">
            {situation.heading}
          </h1>
          <p className="text-muted-foreground text-sm">
            {situation.subheading}
          </p>
        </header>

        {relevant.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="font-serif text-lg font-medium">You already have</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relevant.map((benefit) => (
                <Link
                  className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-foreground/20"
                  href={`/benefits/${benefit.id}`}
                  key={benefit.id}
                >
                  <span className="font-serif text-[15px] font-medium">
                    {benefit.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    via {benefit.providerName}
                  </span>
                  {benefit.value ? (
                    <span className="text-sm">{benefit.value}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-muted-foreground text-sm">
            {user
              ? "None of your current products list a benefit for this situation yet. Add more products to see matches."
              : "Add the cards and memberships you already have to see which benefits apply."}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-xl bg-foreground px-5 py-2.5 text-background text-sm"
            href={`/chat?q=${encodeURIComponent(situation.prompt)}`}
          >
            Ask MembershipMaxxing
          </Link>
          <Link
            className="rounded-xl border border-border/60 px-5 py-2.5 text-sm"
            href="/setup"
          >
            Check My Benefits
          </Link>
        </div>
      </main>
    </div>
  );
}
