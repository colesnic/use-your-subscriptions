// biome-ignore-all lint/performance/noJsxPropsBind: share buttons
"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/periods";

export function ShareCard({
  memberships,
  benefits,
  annualValue,
}: {
  memberships: number;
  benefits: number;
  annualValue: number;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = `I found ${formatUsd(annualValue)}/year of benefits I was already paying for, across ${memberships} memberships and ${benefits} useful benefits. Find yours at membershipmaxxing.com`;

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
  }, [shareText]);

  const share = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText, title: "MembershipMaxxing" });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copy();
  }, [copy, shareText]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card p-8 text-center">
        <span className="font-serif text-sm font-medium">
          MembershipMaxxing
        </span>
        <span className="max-w-md font-serif text-2xl font-medium leading-snug">
          I found {formatUsd(annualValue)}/year of benefits I was already paying
          for.
        </span>
        <span className="text-muted-foreground text-sm">
          {memberships} memberships · {benefits} useful benefits discovered
        </span>
        <span className="text-muted-foreground text-xs">
          membershipmaxxing.com
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={share} type="button">
          Share
        </Button>
        <Button onClick={copy} type="button" variant="outline">
          {copied ? "Copied" : "Copy Link"}
        </Button>
      </div>
    </div>
  );
}
