import Link from "next/link";

const EXAMPLES = [
  {
    bullets: [
      "purchase protection",
      "extended warranty",
      "phone insurance",
      "Costco pricing",
      "carrier upgrade benefits",
    ],
    prompt: "I'm buying a new iPhone.",
    title: "Buying a new phone",
  },
  {
    bullets: [
      "rental-car coverage",
      "travel insurance",
      "status benefits",
      "booking discounts",
    ],
    prompt: "I'm renting a car in Italy.",
    title: "Renting a car",
  },
  {
    bullets: [
      "lounge access",
      "CLEAR",
      "TSA PreCheck",
      "airline credits",
      "rideshare credits",
    ],
    prompt: "I'm flying tomorrow.",
    title: "Going to the airport",
  },
  {
    bullets: ["monthly credits", "unused memberships", "expiring offers"],
    prompt: "What benefits should I use before the end of the month?",
    title: "Benefits expiring",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <span className="font-serif text-[15px] font-medium">
          MembershipMaxxing
        </span>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="rounded-lg bg-foreground px-3 py-1.5 text-background"
            href="/setup"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-4 pb-24">
        <section className="flex flex-col items-center gap-6 pt-16 text-center">
          <h1 className="max-w-3xl font-serif text-4xl font-medium leading-tight sm:text-6xl">
            You&apos;re already paying for it.
            <br />
            Start using it.
          </h1>
          <p className="max-w-xl text-muted-foreground text-sm leading-relaxed sm:text-base">
            Add your cards, memberships, subscriptions, insurance, loyalty
            programs, and workplace perks. Ask what benefits you already have
            before paying for something again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              className="rounded-xl bg-foreground px-5 py-2.5 text-background text-sm"
              href="/setup"
            >
              Find My Benefits
            </Link>
            <Link
              className="rounded-xl border border-border/60 px-5 py-2.5 text-sm"
              href="/chat"
            >
              Try an Example
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-center font-serif text-2xl font-medium">
            Ask about real situations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {EXAMPLES.map((example) => (
              <div
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5"
                key={example.title}
              >
                <h3 className="font-serif text-lg font-medium">
                  {example.title}
                </h3>
                <p className="text-muted-foreground text-sm italic">
                  &ldquo;{example.prompt}&rdquo;
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {example.bullets.map((bullet) => (
                    <li
                      className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground text-xs"
                      key={bullet}
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  className="mt-auto text-sm underline"
                  href={`/chat?q=${encodeURIComponent(example.prompt)}`}
                >
                  Try this question
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card p-10 text-center">
          <h2 className="max-w-xl font-serif text-2xl font-medium">
            Find out what you&apos;re entitled to
          </h2>
          <p className="max-w-lg text-muted-foreground text-sm">
            Select what you already own and get a personal benefits dashboard.
          </p>
          <Link
            className="rounded-xl bg-foreground px-5 py-2.5 text-background text-sm"
            href="/setup"
          >
            Find My Benefits
          </Link>
        </section>
      </main>
    </div>
  );
}
