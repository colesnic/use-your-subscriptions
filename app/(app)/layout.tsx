import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/app-nav";
import { VerifyBanner } from "@/components/app/verify-banner";
import {
  type ChildRelation,
  SubscriptionCatalogProvider,
} from "@/components/subscriptions/subscription-catalog-provider";
import { getCurrentUser } from "@/lib/auth/server";
import {
  getAllProvidersWithBenefitCounts,
  getProviderRelations,
} from "@/lib/db/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [providers, relations] = await Promise.all([
    getAllProvidersWithBenefitCounts(),
    getProviderRelations(),
  ]);

  const relationsByParent = relations.reduce(
    (acc, relation) => {
      const bucket = acc[relation.parentId] ?? [];
      bucket.push({
        childId: relation.childId,
        childName: relation.childName,
        note: relation.note,
      });
      acc[relation.parentId] = bucket;
      return acc;
    },
    {} as Record<string, ChildRelation[]>
  );

  return (
    <SubscriptionCatalogProvider
      providers={providers}
      relations={relationsByParent}
    >
      <div className="min-h-dvh bg-background">
        <AppNav email={user.email} />
        {user.emailVerified ? null : <VerifyBanner />}
        <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
      </div>
    </SubscriptionCatalogProvider>
  );
}
