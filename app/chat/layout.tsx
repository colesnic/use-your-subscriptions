import { Suspense } from "react";
import { Toaster } from "sonner";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { ChatShell } from "@/components/chat/shell";
import type { ChildRelation } from "@/components/subscriptions/subscription-catalog-provider";
import { SubscriptionCatalogProvider } from "@/components/subscriptions/subscription-catalog-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { getSessionUser } from "@/lib/auth/session";
import {
  getAllProvidersWithBenefitCounts,
  getProviderRelations,
} from "@/lib/db/queries";
import { getRecommendedQuestions } from "@/lib/recommendations";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DataStreamProvider>
      <Suspense fallback={<div className="flex h-dvh bg-background" />}>
        <ChatPage>{children}</ChatPage>
      </Suspense>
    </DataStreamProvider>
  );
}

async function ChatPage({ children }: { children: React.ReactNode }) {
  const [providers, relations] = await Promise.all([
    getAllProvidersWithBenefitCounts(),
    getProviderRelations(),
  ]);
  const user = await getSessionUser();
  const suggestions = await getRecommendedQuestions(user?.id ?? null);

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
      <SidebarProvider defaultOpen>
        <SidebarInset>
          <Toaster
            position="top-center"
            theme="system"
            toastOptions={{
              className:
                "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
            }}
          />
          <Suspense fallback={<div className="flex h-dvh" />}>
            <ActiveChatProvider>
              <ChatShell suggestions={suggestions} />
            </ActiveChatProvider>
          </Suspense>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SubscriptionCatalogProvider>
  );
}
