// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setPending(true);
      try {
        await fetch("/api/auth/forgot-password", {
          body: JSON.stringify({ email }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } finally {
        setPending(false);
        setSent(true);
      }
    },
    [email]
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <Link className="font-serif text-2xl font-medium" href="/">
          MembershipMaxxing
        </Link>
        <p className="text-muted-foreground text-sm">Reset your password</p>
      </div>

      {sent ? (
        <p className="text-center text-sm">
          If an account exists for that email, we sent a reset link. Check your
          inbox.
        </p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <Input
            aria-label="Email"
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
          <Button disabled={pending} type="submit">
            {pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}

      <Link
        className="text-center text-muted-foreground text-xs underline"
        href="/login"
      >
        Back to sign in
      </Link>
    </div>
  );
}
