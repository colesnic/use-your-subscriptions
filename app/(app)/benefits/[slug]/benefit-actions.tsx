// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
// biome-ignore-all lint/correctness/useExhaustiveDependencies: transition callbacks
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markBenefit } from "../../actions";

export function BenefitActions({
  benefitId,
  suggestedValue,
  status,
}: {
  benefitId: string;
  suggestedValue: number | null;
  status: "available" | "used" | "not_relevant" | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(
    suggestedValue ? String(Math.round(suggestedValue / 100)) : ""
  );

  const markUsed = useCallback(() => {
    const parsed = amount.trim() ? Math.round(Number(amount) * 100) : null;
    startTransition(async () => {
      await markBenefit({
        benefitId,
        savedAmount: parsed && Number.isFinite(parsed) ? parsed : null,
        status: "used",
      });
      router.refresh();
    });
  }, [amount, benefitId, router, startTransition]);

  const markIrrelevant = useCallback(() => {
    startTransition(async () => {
      await markBenefit({ benefitId, status: "not_relevant" });
      router.refresh();
    });
  }, [benefitId, router, startTransition]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={pending} onClick={markUsed} type="button">
          {status === "used" ? "Marked as used" : "Mark as used"}
        </Button>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Saved $</span>
          <input
            aria-label="Amount saved"
            className="h-8 w-20 rounded-lg border border-input bg-input/30 px-2 text-sm outline-none"
            inputMode="decimal"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            value={amount}
          />
        </div>
        <Button
          disabled={pending}
          onClick={markIrrelevant}
          type="button"
          variant="outline"
        >
          Not relevant
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <a
          className="rounded-lg border border-border/60 px-3 py-1.5"
          href={`/chat?q=${encodeURIComponent(
            `Tell me about the ${benefitId} benefit and how to use it.`
          )}`}
        >
          Ask about this benefit
        </a>
      </div>
    </div>
  );
}
