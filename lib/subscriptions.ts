export const SUBSCRIPTIONS_STORAGE_KEY =
  "use-your-subs:selected-provider-ids:v1";

export const SUBSCRIPTIONS_CHANGED_EVENT = "use-your-subs:changed";

export const SUBSCRIPTION_SECTIONS = [
  {
    description: "Warehouse clubs, delivery, and everyday essentials",
    id: "grocery",
    label: "Grocery & warehouse",
  },
  {
    description: "Premium cards and the perks that come with them",
    id: "credit_card",
    label: "Credit card programs",
  },
  {
    description: "Airport, hotel, and trip benefits",
    id: "travel",
    label: "Travel programs",
  },
  {
    description: "Tools and programs that help on the job",
    id: "work",
    label: "Work & productivity",
  },
  {
    description: "Identity, privacy, and account protection",
    id: "security",
    label: "Security & identity",
  },
  {
    description: "Music, video, and entertainment subscriptions",
    id: "streaming",
    label: "Streaming & entertainment",
  },
  {
    description: "Cell phone plans and the perks bundled with them",
    id: "phone",
    label: "Phone & internet",
  },
  {
    description: "Community, retail, and everyday memberships",
    id: "everyday",
    label: "Everyday & community",
  },
] as const;

export type SubscriptionSectionId =
  (typeof SUBSCRIPTION_SECTIONS)[number]["id"];

export type PickerProvider = {
  annualFee: number | null;
  benefitCount: number;
  category: string;
  description: string | null;
  id: string;
  issuer: string | null;
  name: string;
  section: string;
  slug: string;
  website: string | null;
};

export function providerDomain(
  website: string | null | undefined
): string | null {
  if (!website) {
    return null;
  }
  try {
    const url = new URL(
      website.startsWith("http") ? website : `https://${website}`
    );
    const host = url.hostname.replace(/^www\./, "");
    // Reduce subdomains (e.g. creditcards.chase.com -> chase.com). Good enough
    // for the domains in our catalog; swap for a public-suffix lookup if needed.
    const parts = host.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : host;
  } catch {
    return null;
  }
}

export function providerLogoUrl(
  website: string | null | undefined
): string | null {
  const domain = providerDomain(website);
  return domain ? `https://unavatar.io/${domain}` : null;
}

export const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  SUBSCRIPTION_SECTIONS.map((section) => [section.id, section.label])
);

export function sectionRank(section: string | null | undefined) {
  const index = SUBSCRIPTION_SECTIONS.findIndex(
    (candidate) => candidate.id === section
  );
  return index === -1 ? SUBSCRIPTION_SECTIONS.length : index;
}

export function getSelectedSubscriptionIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function setSelectedSubscriptionIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(SUBSCRIPTIONS_CHANGED_EVENT));
}

export function subscribeToSelectedSubscriptions(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(SUBSCRIPTIONS_CHANGED_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(SUBSCRIPTIONS_CHANGED_EVENT, handler);
  };
}
