import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
      <Link className="font-serif text-[15px] font-medium" href="/">
        MembershipMaxxing
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link
          className="text-muted-foreground transition-colors hover:text-foreground"
          href="/situations"
        >
          Situations
        </Link>
        <Link
          className="text-muted-foreground transition-colors hover:text-foreground"
          href="/value"
        >
          Value
        </Link>
        <Link
          className="rounded-lg bg-foreground px-3 py-1.5 text-background"
          href="/setup"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
