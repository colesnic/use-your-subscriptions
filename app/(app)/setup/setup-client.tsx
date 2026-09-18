// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
// biome-ignore-all lint/correctness/useExhaustiveDependencies: transition callbacks
"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useSubscriptionCatalog } from "@/components/subscriptions/subscription-catalog-provider";
import { SubscriptionPicker } from "@/components/subscriptions/subscription-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSelectedSubscriptionIds,
  setSelectedSubscriptionIds,
} from "@/lib/subscriptions";
import {
  addCustomProduct,
  removeCustomProduct,
  saveProviders,
} from "../actions";

type CustomProduct = {
  id: string;
  name: string;
  provider: string | null;
  notes: string | null;
};

export function SetupClient({
  initialSelectedIds,
  customProducts,
}: {
  initialSelectedIds: string[];
  customProducts: CustomProduct[];
}) {
  const providers = useSubscriptionCatalog();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(customProducts);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setSelectedSubscriptionIds(initialSelectedIds);
  }, [initialSelectedIds]);

  const handleSave = useCallback(() => {
    const ids = getSelectedSubscriptionIds();
    startTransition(async () => {
      await saveProviders(ids);
      router.push("/dashboard");
    });
  }, [router, startTransition]);

  const handleAdd = useCallback(() => {
    if (!name.trim()) {
      return;
    }
    startTransition(async () => {
      await addCustomProduct({ name, notes, provider: company });
      setName("");
      setCompany("");
      setNotes("");
      router.refresh();
    });
  }, [company, name, notes, router, startTransition]);

  const handleRemove = useCallback(
    (id: string) => {
      startTransition(async () => {
        await removeCustomProduct(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      });
    },
    [router, startTransition]
  );

  return (
    <div className="flex flex-col gap-10">
      <SubscriptionPicker
        mode="manage"
        providers={providers}
        showFooter={false}
      />

      <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-serif text-lg font-medium">
            Can&apos;t find something? Add it manually
          </h2>
          <p className="text-muted-foreground text-xs">
            Custom products are stored on your profile and marked as
            user-created.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            aria-label="Product name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Product name"
            value={name}
          />
          <Input
            aria-label="Provider or company"
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Provider or company"
            value={company}
          />
          <Input
            aria-label="Notes"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes (optional)"
            value={notes}
          />
        </div>
        <div>
          <Button
            disabled={pending || !name.trim()}
            onClick={handleAdd}
            size="sm"
            type="button"
            variant="outline"
          >
            Add product
          </Button>
        </div>
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2 pt-1">
            {items.map((item) => (
              <li
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/40 px-3 py-2"
                key={item.id}
              >
                <span className="flex flex-col">
                  <span className="text-sm">{item.name}</span>
                  {item.provider ? (
                    <span className="text-muted-foreground text-xs">
                      {item.provider}
                    </span>
                  ) : null}
                </span>
                <button
                  aria-label={`Remove ${item.name}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleRemove(item.id)}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button disabled={pending} onClick={handleSave} type="button">
          {pending ? "Saving..." : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}
