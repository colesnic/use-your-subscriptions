"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { PickerProvider } from "@/lib/subscriptions";

export type ChildRelation = {
  childId: string;
  childName: string;
  note: string | null;
};

type CatalogValue = {
  providers: PickerProvider[];
  relations: Record<string, ChildRelation[]>;
};

const SubscriptionCatalogContext = createContext<CatalogValue>({
  providers: [],
  relations: {},
});

export function SubscriptionCatalogProvider({
  children,
  providers,
  relations,
}: {
  children: ReactNode;
  providers: PickerProvider[];
  relations: Record<string, ChildRelation[]>;
}) {
  return (
    <SubscriptionCatalogContext.Provider value={{ providers, relations }}>
      {children}
    </SubscriptionCatalogContext.Provider>
  );
}

export function useSubscriptionCatalog() {
  return useContext(SubscriptionCatalogContext).providers;
}

export function useSubscriptionRelations() {
  return useContext(SubscriptionCatalogContext).relations;
}
