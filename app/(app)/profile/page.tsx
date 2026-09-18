import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserCustomProducts, getUserProviderIds } from "@/lib/db/account";
import { getAllProvidersWithBenefitCounts } from "@/lib/db/queries";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [providerIds, customProducts, providers] = await Promise.all([
    getUserProviderIds(user.id),
    getUserCustomProducts(user.id),
    getAllProvidersWithBenefitCounts(),
  ]);

  const byId = new Map(providers.map((item) => [item.id, item]));
  const selected = providerIds
    .map((id) => byId.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium">Profile</h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium">
            Memberships ({selected.length})
          </h2>
          <Link className="text-sm underline" href="/setup">
            Manage
          </Link>
        </div>
        {selected.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You haven&apos;t added any products yet.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {selected.map((item) => (
              <li
                className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2"
                key={item.id}
              >
                <span className="text-sm">{item.name}</span>
                <span className="text-muted-foreground text-xs">
                  {item.benefitCount} benefits
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {customProducts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-lg font-medium">
            Custom products ({customProducts.length})
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {customProducts.map((item) => (
              <li
                className="flex flex-col rounded-xl border border-border/60 bg-card px-3 py-2"
                key={item.id}
              >
                <span className="text-sm">{item.name}</span>
                {item.provider ? (
                  <span className="text-muted-foreground text-xs">
                    {item.provider}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
