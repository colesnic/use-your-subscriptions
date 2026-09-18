"use client";

import { useCallback, useState } from "react";

export function VerifyBanner() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const resend = useCallback(async () => {
    setPending(true);
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setPending(false);
    setSent(true);
  }, []);

  return (
    <div className="border-border/60 border-b bg-muted/50 px-4 py-2 text-center text-xs">
      {sent ? (
        <span className="text-muted-foreground">
          Verification email sent. Check your inbox.
        </span>
      ) : (
        <span className="text-muted-foreground">
          Please verify your email.{" "}
          <button
            className="underline disabled:opacity-50"
            disabled={pending}
            onClick={resend}
            type="button"
          >
            Resend email
          </button>
        </span>
      )}
    </div>
  );
}
