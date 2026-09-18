"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/benefits", label: "Benefits" },
  { href: "/setup", label: "My products" },
  { href: "/chat", label: "Ask" },
];

export function AppNav({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link className="font-serif text-[15px] font-medium" href="/dashboard">
          MembershipMaxxing
        </Link>
        <nav className="ml-auto flex items-center gap-0.5 text-sm">
          {LINKS.map((link) => (
            <Link
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "bg-muted text-foreground"
                  : ""
              )}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          {email ? (
            <button
              className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              disabled={signingOut}
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </button>
          ) : (
            <Link
              className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              href="/login"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
