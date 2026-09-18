// biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: onError fallback for a decorative logo
"use client";

import { useCallback, useState } from "react";
import { providerLogoUrls } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function ProviderLogo({
  className,
  name,
  website,
}: {
  className?: string;
  name: string;
  website?: string | null;
}) {
  const urls = providerLogoUrls(website);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    setIndex((current) => {
      const next = current + 1;
      if (next >= urls.length) {
        setFailed(true);
      }
      return next;
    });
  }, [urls.length]);

  const src = urls[index];

  if (!src || failed) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-md bg-muted font-medium text-[10px] text-muted-foreground ring-1 ring-border/50",
          className
        )}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: remote provider logo
    <img
      alt=""
      className={cn(
        "rounded-md bg-white object-contain p-0.5 ring-1 ring-border/50",
        className
      )}
      height={24}
      loading="lazy"
      onError={handleError}
      src={src}
      width={24}
    />
  );
}
