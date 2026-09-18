// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
"use client";

import { useMemo, useState } from "react";
import { annualizedValue, formatUsd } from "@/lib/periods";

type Provider = {
  id: string;
  name: string;
  issuer: string | null;
  category: string;
};

type ValuedBenefit = {
  monetaryValue: number | null;
  providerId: string;
  title: string;
  valuePeriod: string | null;
};

export function ValueCalculator({
  providers,
  benefits,
  initialSelectedIds,
}: {
  providers: Provider[];
  benefits: ValuedBenefit[];
  initialSelectedIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [query, setQuery] = useState("");

  const valueByProvider = useMemo(() => {
    const map = new Map<string, number>();
    for (const benefit of benefits) {
      map.set(
        benefit.providerId,
        (map.get(benefit.providerId) ?? 0) +
          annualizedValue(benefit.monetaryValue, benefit.valuePeriod)
      );
    }
    return map;
  }, [benefits]);

  const options = useMemo(
    () =>
      providers.filter(
        (provider) =>
          valueByProvider.has(provider.id) &&
          (!query || provider.name.toLowerCase().includes(query.toLowerCase()))
      ),
    [providers, query, valueByProvider]
  );

  const total = useMemo(
    () => selected.reduce((sum, id) => sum + (valueByProvider.get(id) ?? 0), 0),
    [selected, valueByProvider]
  );

  const breakdown = useMemo(
    () =>
      selected
        .map((id) => ({
          provider: providers.find((provider) => provider.id === id),
          value: valueByProvider.get(id) ?? 0,
        }))
        .filter((entry): entry is { provider: Provider; value: number } =>
          Boolean(entry.provider)
        )
        .sort((a, b) => b.value - a.value),
    [selected, providers, valueByProvider]
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-6 text-center">
        <span className="text-muted-foreground text-xs">
          Potential benefit value
        </span>
        <span className="font-serif text-4xl font-medium">
          {total > 0 ? `${formatUsd(total)}/year` : "$0/year"}
        </span>
        <span className="text-muted-foreground text-xs">
          {selected.length} product{selected.length === 1 ? "" : "s"} selected
        </span>
      </div>

      <div className="flex h-9 items-center gap-2 rounded-4xl border border-input bg-input/30 px-3">
        <input
          aria-label="Search products"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products with explicit values"
          type="text"
          value={query}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((provider) => {
          const isSelected = selected.includes(provider.id);
          return (
            <button
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-foreground/40 bg-muted/70"
                  : "border-border/60 bg-card hover:border-foreground/20"
              }`}
              key={provider.id}
              onClick={() => toggle(provider.id)}
              type="button"
            >
              <span className="flex flex-col">
                <span className="text-sm">{provider.name}</span>
                {provider.issuer ? (
                  <span className="text-muted-foreground text-xs">
                    {provider.issuer}
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatUsd(valueByProvider.get(provider.id) ?? 0)}/yr
              </span>
            </button>
          );
        })}
      </div>

      {breakdown.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-serif text-lg font-medium">Breakdown</h2>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            {breakdown.map((entry) => (
              <div
                className="flex items-center justify-between border-border/50 border-b px-4 py-2.5 last:border-0"
                key={entry.provider.id}
              >
                <span className="text-sm">{entry.provider.name}</span>
                <span className="text-sm">{formatUsd(entry.value)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
