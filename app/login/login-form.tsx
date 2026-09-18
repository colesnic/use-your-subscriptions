// biome-ignore-all lint/performance/noJsxPropsBind: controlled form inputs
// biome-ignore-all lint/correctness/useExhaustiveDependencies: transition callbacks
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setPending(true);

      try {
        const response = await fetch(
          `/api/auth/${mode === "signin" ? "login" : "signup"}`,
          {
            body: JSON.stringify({ email, name, password }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          }
        );

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }

        router.push(next);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setPending(false);
      }
    },
    [email, mode, name, next, password, router]
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <Link className="font-serif text-2xl font-medium" href="/">
          MembershipMaxxing
        </Link>
        <p className="text-muted-foreground text-sm">
          {mode === "signin"
            ? "Sign in to see your benefits."
            : "Create an account to save your products."}
        </p>
      </div>

      <form className="flex flex-col gap-3" onSubmit={submit}>
        {mode === "signup" ? (
          <Input
            aria-label="Name"
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Name (optional)"
            value={name}
          />
        ) : null}
        <Input
          aria-label="Email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <Input
          aria-label="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (8+ characters)"
          required
          type="password"
          value={password}
        />
        {error ? (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : null}
        <Button disabled={pending} type="submit">
          {pending
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <button
        className="text-muted-foreground text-xs underline"
        onClick={() => {
          setError(null);
          setMode((current) => (current === "signin" ? "signup" : "signin"));
        }}
        type="button"
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
