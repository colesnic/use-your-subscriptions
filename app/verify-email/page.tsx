import { Suspense } from "react";
import { VerifyEmailClient } from "./verify-email-client";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Suspense
        fallback={<p className="text-muted-foreground text-sm">Verifying…</p>}
      >
        <VerifyEmailClient />
      </Suspense>
    </div>
  );
}
