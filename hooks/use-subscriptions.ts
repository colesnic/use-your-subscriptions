"use client";

import { useSyncExternalStore } from "react";
import {
  getSelectedSubscriptionIds,
  SUBSCRIPTIONS_STORAGE_KEY,
  subscribeToSelectedSubscriptions,
} from "@/lib/subscriptions";

let cachedRaw: string | null = null;
let cachedIds: string[] = [];
const EMPTY: string[] = [];

function getSnapshot(): string[] {
  const raw =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = getSelectedSubscriptionIds();
  }

  return cachedIds;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

export function useSelectedSubscriptionIds(): string[] {
  return useSyncExternalStore(
    subscribeToSelectedSubscriptions,
    getSnapshot,
    getServerSnapshot
  );
}
