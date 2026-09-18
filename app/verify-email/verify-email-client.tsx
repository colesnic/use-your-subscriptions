"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This link is missing its verification token.");
      return;
    }

    let active = true;

    const verify = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          body: JSON.stringify({ token }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!active) {
          return;
        }

        if (response.ok) {
          setState("ok");
          return;
        }

        let errorMessage = "We could not verify this link.";
        try {
          const data = (await response.json()) as { error?: string };
          errorMessage = data.error ?? errorMessage;
        } catch {
          // keep the default message
        }
        setState("error");
        setMessage(errorMessage);
      } catch {
        if (active) {
          setState("error");
          setMessage("We could not verify this link.");
        }
      }
    };

    verify().catch(() => {
      // errors are handled inside verify()
    });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <Link className="font-serif text-2xl font-medium" href="/">
        MembershipMaxxing
      </Link>
      {state === "loading" ? (
        <p className="text-muted-foreground text-sm">Verifying your email…</p>
      ) : null}
      {state === "ok" ? (
        <>
          <p className="text-sm">Your email is verified.</p>
          <Link
            className="rounded-lg bg-foreground px-4 py-2 text-background text-sm"
            href="/dashboard"
          >
            Go to dashboard
          </Link>
        </>
      ) : null}
      {state === "error" ? (
        <>
          <p className="text-destructive text-sm">{message}</p>
          <Link className="text-sm underline" href="/dashboard">
            Back to dashboard
          </Link>
        </>
      ) : null}
    </div>
  );
}
