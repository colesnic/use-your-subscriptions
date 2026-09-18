import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/marketing/site-header";
import { getBenefitsByProviderId, getProviderBySlug } from "@/lib/db/queries";

const CATEGORY_LABELS: Record<string, string> = {
  car_rental: "Car rental",
  dining: "Dining",
  everyday: "Everyday",
  insurance: "Insurance",
  lounge: "Lounge",
  rewards: "Rewards",
  security: "Security",
  shopping: "Shopping",
  streaming: "Streaming",
  travel: "Travel",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  if (!provider) {
    notFound();
  }

  const benefits = await getBenefitsByProviderId(provider.id);
  const grouped = new Map<string, typeof benefits>();
  for (const benefit of benefits) {
    const list = grouped.get(benefit.category) ?? [];
    list.push(benefit);
    grouped.set(benefit.category, list);
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pb-24">
        <header className="flex flex-col gap-2 pt-10">
          <h1 className="font-serif text-3xl font-medium sm:text-4xl">
            {provider.name} benefits
          </h1>
          {provider.description ? (
            <p className="text-muted-foreground text-sm">
              {provider.description}
            </p>
          ) : null}
          {provider.annualFee ? (
            <p className="text-muted-foreground text-xs">
              ${Math.round(provider.annualFee / 100)} annual fee
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">No annual fee</p>
          )}
        </header>

        {[...grouped.entries()].map(([category, items]) => (
          <section className="flex flex-col gap-3" key={category}>
            <h2 className="font-serif text-lg font-medium">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((benefit) => (
                <div
                  className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-4"
                  key={benefit.id}
                >
                  <span className="font-serif text-[15px] font-medium">
                    {benefit.title}
                  </span>
                  <span className="text-muted-foreground text-xs leading-relaxed">
                    {benefit.summary}
                  </span>
                  {benefit.value ? (
                    <span className="text-sm">{benefit.value}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-xl bg-foreground px-5 py-2.5 text-background text-sm"
            href="/setup"
          >
            Already have this? Add it to MembershipMaxxing
          </Link>
        </div>
      </main>
    </div>
  );
}
