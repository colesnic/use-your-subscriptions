"use client";

import { CircleHelp } from "lucide-react";
import { memo } from "react";
import { SubscriptionsDialog } from "@/components/subscriptions/subscriptions-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VisibilityType } from "./visibility-selector";

const CONTACT_EMAIL = "Nickcolesp@gmail.com";

function PureChatHeader({
  chatId: _chatId,
  selectedVisibilityType: _selectedVisibilityType,
  isReadonly: _isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  return (
    <header className="sticky top-0 flex h-14 items-center justify-end gap-2 bg-sidebar px-3">
      <SubscriptionsDialog />
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            aria-label={`Questions or issues? Email ${CONTACT_EMAIL}`}
            className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            <CircleHelp className="size-4" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Questions or issues? Email {CONTACT_EMAIL}
        </TooltipContent>
      </Tooltip>
    </header>
  );
}

export const ChatHeader = memo(
  PureChatHeader,
  (prevProps, nextProps) =>
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
);
