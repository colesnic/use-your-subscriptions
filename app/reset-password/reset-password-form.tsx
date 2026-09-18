// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setPending(true);
      try {
        const response = await fetch("/api/auth/reset-password", {
          body: JSON.stringify({ password, token }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "We could not reset your password.");
          return;
        }
        setDone(true);
      } finally {
        setPending(false);
      }
    },
    [password, token]
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <Link className="font-serif text-2xl font-medium" href="/">
          MembershipMaxxing
        </Link>
        <p className="text-muted-foreground text-sm">Choose a new password</p>
      </div>

      {done ? (
        <>
          <p className="text-center text-sm">Your password has been updated.</p>
          <Link
            className="rounded-lg bg-foreground px-4 py-2 text-center text-background text-sm"
            href="/login"
          >
            Sign in
          </Link>
        </>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <Input
            aria-label="New password"
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password (8+ characters)"
            required
            type="password"
            value={password}
          />
          {error ? (
            <p className="text-destructive text-xs" role="alert">
              {error}
            </p>
          ) : null}
          <Button disabled={pending || !token} type="submit">
            {pending ? "Saving..." : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
