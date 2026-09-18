import { SiteHeader } from "@/components/marketing/site-header";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserProviderIds } from "@/lib/db/account";
import { getAllProviders, getValuedBenefits } from "@/lib/db/queries";
import { ValueCalculator } from "./value-calculator";

export default async function ValuePage() {
  const [providers, benefits, user] = await Promise.all([
    getAllProviders(),
    getValuedBenefits(),
    getCurrentUser(),
  ]);

  const initialSelectedIds = user ? await getUserProviderIds(user.id) : [];

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pb-24">
        <header className="flex flex-col gap-2 pt-10 text-center">
          <h1 className="font-serif text-3xl font-medium sm:text-4xl">
            How much are your memberships actually worth?
          </h1>
          <p className="text-muted-foreground text-sm">
            Select what you have to estimate the benefits with explicit dollar
            values.
          </p>
        </header>
        <ValueCalculator
          benefits={benefits}
          initialSelectedIds={initialSelectedIds}
          providers={providers.map((provider) => ({
            category: provider.category,
            id: provider.id,
            issuer: provider.issuer,
            name: provider.name,
          }))}
        />
        <p className="text-center text-muted-foreground text-xs">
          Potential benefit value, based only on benefits with explicit dollar
          values. Actual value depends on which benefits you use.
        </p>
      </main>
    </div>
  );
}
