"use client";

import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSelectedSubscriptionIds } from "@/hooks/use-subscriptions";
import {
  getSelectedSubscriptionIds,
  type PickerProvider,
  SECTION_LABELS,
  SUBSCRIPTION_SECTIONS,
  sectionRank,
  setSelectedSubscriptionIds,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import { ProviderLogo } from "./provider-logo";
import {
  type ChildRelation,
  useSubscriptionRelations,
} from "./subscription-catalog-provider";

const categoryLabels: Record<string, string> = {
  credit_card: "Credit card",
  insurance: "Insurance",
  loyalty: "Loyalty",
  membership: "Membership",
};

const SEARCH_ALIASES: Record<string, string[]> = {
  aa: ["american airlines", "aadvantage"],
  amex: ["american express"],
  boa: ["bank of america"],
  capone: ["capital one"],
  tsa: ["tsa precheck"],
};

function matchesSearch(haystack: string, query: string) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((token) => {
    const expansions = SEARCH_ALIASES[token] ?? [token];
    return expansions.some((expansion) => haystack.includes(expansion));
  });
}

function formatFee(fee: number | null) {
  if (!fee) {
    return "No annual fee";
  }
  return `$${Math.round(fee / 100)}/year`;
}

export function SubscriptionPicker({
  mode,
  onDone,
  providers,
  showFooter = true,
}: {
  mode: "onboarding" | "manage";
  onDone?: () => void;
  providers: PickerProvider[];
  showFooter?: boolean;
}) {
  const router = useRouter();
  const selectedIds = useSelectedSubscriptionIds();
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const relations = useSubscriptionRelations();
  const [childPrompt, setChildPrompt] = useState<{
    parentName: string;
    children: ChildRelation[];
    selected: Set<string>;
  } | null>(null);
  const [query, setQuery] = useState("");

  const filteredProviders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return providers;
    }
    return providers.filter((provider) =>
      matchesSearch(
        [
          provider.name,
          provider.issuer,
          provider.description,
          provider.category,
          SECTION_LABELS[provider.section],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        term
      )
    );
  }, [providers, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, PickerProvider[]>();
    for (const provider of filteredProviders) {
      const key = provider.section || "other";
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(provider);
      } else {
        groups.set(key, [provider]);
      }
    }
    return [...groups.entries()].sort(
      ([a], [b]) => sectionRank(a) - sectionRank(b)
    );
  }, [filteredProviders]);

  const toggle = useCallback((id: string) => {
    const next = new Set(getSelectedSubscriptionIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedSubscriptionIds([...next]);
  }, []);

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.providerId;
      if (!id) {
        return;
      }
      const wasSelected = selected.has(id);
      toggle(id);
      if (wasSelected) {
        return;
      }
      const children = relations[id] ?? [];
      if (children.length > 0) {
        setChildPrompt({
          children,
          parentName:
            providers.find((p) => p.id === id)?.name ?? "This program",
          selected: new Set(children.map((child) => child.childId)),
        });
      }
    },
    [providers, relations, selected, toggle]
  );

  const handleChildToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { childId } = event.currentTarget.dataset;
      if (!childId) {
        return;
      }
      setChildPrompt((prev) => {
        if (!prev) {
          return prev;
        }
        const next = new Set(prev.selected);
        if (next.has(childId)) {
          next.delete(childId);
        } else {
          next.add(childId);
        }
        return { ...prev, selected: next };
      });
    },
    []
  );

  const handleChildOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setChildPrompt(null);
    }
  }, []);

  const handleChildSkip = useCallback(() => {
    setChildPrompt(null);
  }, []);

  const handleChildConfirm = useCallback(() => {
    if (!childPrompt) {
      return;
    }
    const next = new Set(getSelectedSubscriptionIds());
    for (const childId of childPrompt.selected) {
      next.add(childId);
    }
    setSelectedSubscriptionIds([...next]);
    setChildPrompt(null);
  }, [childPrompt]);

  const handleDone = useCallback(() => {
    if (onDone) {
      onDone();
      return;
    }
    router.push("/");
  }, [onDone, router]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="sticky top-0 z-20 -mx-1 bg-background/95 px-1 pb-1 backdrop-blur">
        <div className="flex h-9 items-center gap-2 rounded-4xl border border-input bg-input/30 px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search subscriptions"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onChange={handleSearchChange}
            placeholder="Search cards and memberships"
            type="text"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              onClick={handleClearSearch}
              type="button"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {grouped.map(([sectionId, sectionProviders]) => (
        <section className="flex flex-col gap-3" key={sectionId}>
          <div className="flex flex-col gap-0.5">
            <h2 className="font-medium text-sm">
              {SECTION_LABELS[sectionId] ?? "Other"}
            </h2>
            {SUBSCRIPTION_SECTIONS.find((s) => s.id === sectionId)
              ?.description ? (
              <p className="text-muted-foreground text-xs">
                {
                  SUBSCRIPTION_SECTIONS.find((s) => s.id === sectionId)
                    ?.description
                }
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {sectionProviders.map((provider) => {
              const isSelected = selected.has(provider.id);
              return (
                <button
                  className={cn(
                    "group flex h-full touch-manipulation flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                    isSelected
                      ? "border-foreground/40 bg-muted/70"
                      : "border-border/60 bg-card hover:border-foreground/20 hover:bg-muted/40"
                  )}
                  data-provider-id={provider.id}
                  key={provider.id}
                  onClick={handleCardClick}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <ProviderLogo
                        className="size-6 shrink-0"
                        name={provider.name}
                        website={provider.website}
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-serif text-[15px] font-medium leading-tight">
                          {provider.name}
                        </span>
                        {provider.issuer ? (
                          <span className="text-muted-foreground text-xs">
                            {provider.issuer}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-transparent"
                      )}
                    >
                      <CheckIcon className="size-3" />
                    </span>
                  </div>

                  {provider.description ? (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {provider.description}
                    </p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {categoryLabels[provider.category] ?? provider.category}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {provider.benefitCount} benefits
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {formatFee(provider.annualFee)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {query.trim() && grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No subscriptions match your search.
        </p>
      ) : null}

      {showFooter ? (
        <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-border/60 border-t bg-background/95 px-1 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <span className="text-muted-foreground text-xs">
            {selected.size} selected · saved on this device
          </span>
          <div className="flex items-center gap-2">
            <Button
              className="touch-manipulation"
              onClick={handleDone}
              type="button"
            >
              {mode === "onboarding" ? "Continue" : "Done"}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog onOpenChange={handleChildOpenChange} open={Boolean(childPrompt)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {childPrompt?.parentName} includes other programs
            </DialogTitle>
            <DialogDescription>
              These come bundled or free with it. Select any you're enrolled in
              — uncheck the ones you don't have.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {childPrompt?.children.map((child) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3"
                key={child.childId}
              >
                <input
                  checked={childPrompt.selected.has(child.childId)}
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  data-child-id={child.childId}
                  onChange={handleChildToggle}
                  type="checkbox"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-serif text-[15px] font-medium">
                    {child.childName}
                  </span>
                  {child.note ? (
                    <span className="text-muted-foreground text-xs">
                      {child.note}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button
              className="touch-manipulation"
              onClick={handleChildSkip}
              type="button"
              variant="ghost"
            >
              Not enrolled
            </Button>
            <Button
              className="touch-manipulation"
              onClick={handleChildConfirm}
              type="button"
            >
              Add selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
