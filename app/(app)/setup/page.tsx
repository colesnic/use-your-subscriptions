import { getCurrentUser } from "@/lib/auth/server";
import { getUserCustomProducts, getUserProviderIds } from "@/lib/db/account";
import { SetupClient } from "./setup-client";

export default async function SetupPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [selectedIds, customProducts] = await Promise.all([
    getUserProviderIds(user.id),
    getUserCustomProducts(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium">Your products</h1>
        <p className="text-muted-foreground text-sm">
          Select everything you already pay for. We surface the benefits hiding
          inside.
        </p>
      </header>
      <SetupClient
        customProducts={customProducts.map((item) => ({
          id: item.id,
          name: item.name,
          notes: item.notes,
          provider: item.provider,
        }))}
        initialSelectedIds={selectedIds}
      />
    </div>
  );
}
