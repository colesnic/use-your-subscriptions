// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
// biome-ignore-all lint/correctness/useExhaustiveDependencies: transition callbacks
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type BenefitCard = {
  id: string;
  title: string;
  summary: string;
  category: string;
  providerName: string;
  value: string | null;
  monetaryValue: number | null;
  resetFrequency: string | null;
  daysLeft: number | null;
  used: boolean;
  tags: string[];
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "expiring", label: "Expiring soon" },
  { id: "unused", label: "Unused" },
  { id: "travel", label: "Travel" },
  { id: "shopping", label: "Shopping" },
  { id: "dining", label: "Food" },
  { id: "insurance", label: "Insurance" },
  { id: "lounge", label: "Lounge" },
  { id: "streaming", label: "Entertainment" },
];

export function BenefitsBrowser({
  benefits,
  initialFilter = "all",
}: {
  benefits: BenefitCard[];
  initialFilter?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return benefits.filter((benefit) => {
      if (
        filter === "expiring" &&
        !(benefit.daysLeft !== null && benefit.daysLeft <= 30)
      ) {
        return false;
      }
      if (filter === "unused" && benefit.used) {
        return false;
      }
      if (
        filter !== "all" &&
        filter !== "expiring" &&
        filter !== "unused" &&
        benefit.category !== filter
      ) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        benefit.title,
        benefit.summary,
        benefit.providerName,
        benefit.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [benefits, filter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-9 items-center gap-2 rounded-4xl border border-input bg-input/30 px-3">
        <input
          aria-label="Search your benefits"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your benefits"
          type="text"
          value={query}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((entry) => (
          <button
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === entry.id
                ? "border-foreground/40 bg-muted text-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
            key={entry.id}
            onClick={() => setFilter(entry.id)}
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        {filtered.length} benefit{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No benefits match. Try a different search or filter.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((benefit) => (
            <Link
              className="flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-foreground/20"
              href={`/benefits/${benefit.id}`}
              key={benefit.id}
            >
              <span className="font-serif text-[15px] font-medium leading-tight">
                {benefit.title}
              </span>
              <span className="text-muted-foreground text-xs">
                {benefit.providerName}
              </span>
              <span className="text-muted-foreground text-xs leading-relaxed">
                {benefit.summary}
              </span>
              <span className="mt-auto flex items-center gap-2 pt-1 text-xs">
                {benefit.value ? (
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {benefit.value}
                  </span>
                ) : null}
                {benefit.daysLeft !== null && benefit.daysLeft <= 30 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {benefit.daysLeft} days left
                  </span>
                ) : null}
                {benefit.used ? (
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Used
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
