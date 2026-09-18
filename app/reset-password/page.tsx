import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Suspense
        fallback={<p className="text-muted-foreground text-sm">Loading…</p>}
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
