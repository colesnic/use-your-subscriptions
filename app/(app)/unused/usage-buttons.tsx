// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
// biome-ignore-all lint/correctness/useExhaustiveDependencies: transition callbacks
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markBenefit } from "../actions";

export function UsageButtons({ benefitId }: { benefitId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const markUsed = useCallback(() => {
    startTransition(async () => {
      await markBenefit({ benefitId, status: "used" });
      router.refresh();
    });
  }, [benefitId, router, startTransition]);

  const markIrrelevant = useCallback(() => {
    startTransition(async () => {
      await markBenefit({ benefitId, status: "not_relevant" });
      router.refresh();
    });
  }, [benefitId, router, startTransition]);

  return (
    <div className="flex items-center gap-1.5">
      <Button disabled={pending} onClick={markUsed} size="sm" type="button">
        Mark used
      </Button>
      <Button
        disabled={pending}
        onClick={markIrrelevant}
        size="sm"
        type="button"
        variant="ghost"
      >
        Not relevant
      </Button>
    </div>
  );
}
