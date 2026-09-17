"use client";

import { Sparkles, WalletIcon } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSelectedSubscriptionIds } from "@/hooks/use-subscriptions";
import { useSubscriptionCatalog } from "./subscription-catalog-provider";
import { SubscriptionPicker } from "./subscription-picker";

export function SubscriptionsDialog({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const providers = useSubscriptionCatalog();
  const selected = useSelectedSubscriptionIds();

  const handleDone = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            className="rounded-lg border-border/60 text-[12px] text-muted-foreground hover:text-foreground md:ml-auto"
            size="sm"
            variant="outline"
          >
            <WalletIcon className="size-3.5" />
            Subscriptions
            {selected.length > 0 ? (
              <span className="rounded-full bg-foreground px-1.5 text-[10px] text-background">
                {selected.length}
              </span>
            ) : null}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 overflow-hidden rounded-3xl pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-3xl sm:rounded-4xl">
        <DialogHeader>
          <DialogTitle>Your subscriptions</DialogTitle>
          <DialogDescription>
            Select everything you have. Your choices are saved on this device
            and used to personalize every answer.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pr-1">
          <SubscriptionPicker
            mode="manage"
            onDone={handleDone}
            providers={providers}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionsButton() {
  const selected = useSelectedSubscriptionIds();

  return (
    <SubscriptionsDialog>
      <Button
        className="h-7 touch-manipulation gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        size="sm"
        type="button"
        variant="ghost"
      >
        <WalletIcon className="size-3.5" />
        <span className="hidden sm:inline">
          {selected.length > 0
            ? `Subscriptions (${selected.length})`
            : "Subscriptions"}
        </span>
      </Button>
    </SubscriptionsDialog>
  );
}

export function SubscriptionPromptCard() {
  const selected = useSelectedSubscriptionIds();

  return (
    <SubscriptionsDialog>
      <button
        className="pointer-events-auto flex w-full max-w-md flex-col gap-1.5 rounded-2xl border border-border/60 bg-card/80 p-4 text-left shadow-[var(--shadow-card)] backdrop-blur transition-colors hover:border-foreground/20 hover:bg-card"
        type="button"
      >
        <span className="flex items-center gap-2 font-serif text-base font-medium">
          <Sparkles className="size-4 text-muted-foreground" />
          {selected.length > 0
            ? `${selected.length} subscription${selected.length === 1 ? "" : "s"} selected`
            : "Make it personal"}
        </span>
        <span className="text-muted-foreground text-xs leading-relaxed">
          {selected.length > 0
            ? "Tap to add or remove the cards and memberships you have."
            : "Add the cards, memberships, and programs you already have so I can tell you which perks apply."}
        </span>
      </button>
    </SubscriptionsDialog>
  );
}
