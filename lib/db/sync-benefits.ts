// biome-ignore-all lint/performance/noAwaitInLoops: sequential fetch/extract is intentional
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createClient } from "@libsql/client";
import { generateText } from "ai";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { z } from "zod";
import { benefit, provider } from "./schema";

config({ path: ".env.local" });

const client = createClient({
  authToken: process.env.DATABASE_AUTH_TOKEN,
  url: process.env.DATABASE_URL ?? "file:./local.db",
});
const db = drizzle(client);

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY ?? "" });

const PROPOSALS_DIR = path.join(process.cwd(), "lib", "db", "proposals");
const MAX_CHARS = 60_000;

/**
 * Providers to check. Add more here as coverage grows. Each entry points at the
 * official page(s) that describe the program's benefits.
 */
const sources: { slug: string; urls: string[] }[] = [
  {
    slug: "amex-platinum",
    urls: ["https://www.americanexpress.com/us/credit-cards/card/platinum/"],
  },
  {
    slug: "chase-sapphire-reserve",
    urls: [
      "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
    ],
  },
  {
    slug: "chase-sapphire-preferred",
    urls: [
      "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
    ],
  },
  {
    slug: "amex-gold",
    urls: ["https://www.americanexpress.com/us/credit-cards/card/gold-card/"],
  },
  {
    slug: "capital-one-venture-x",
    urls: ["https://www.capitalone.com/credit-cards/venture-x/"],
  },
  {
    slug: "uber-one",
    urls: ["https://www.uber.com/us/en/uber-one/"],
  },
];

const extractedBenefitSchema = z.object({
  category: z.string(),
  details: z.string(),
  howToUse: z.string().optional(),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
  title: z.string(),
  value: z.string().optional(),
});

const extractionSchema = z.object({
  benefits: z.array(extractedBenefitSchema),
});

type ExtractedBenefit = z.infer<typeof extractedBenefitSchema>;

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }

  const html = await response.text();

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function extractBenefits(
  providerName: string,
  text: string,
  existingTitles: string[]
): Promise<ExtractedBenefit[]> {
  const { text: output } = await generateText({
    model: deepseek("deepseek-chat"),
    prompt: `You extract structured benefits data for the "${providerName}" program.

From the page text below, list the concrete benefits and perks a member actually gets. For each, return:
- title: short name of the benefit
- category: one of car_rental, travel, dining, shopping, lounge, insurance, security, streaming, everyday
- summary: one sentence
- details: 1-3 sentences with specifics (amounts, limits, caveats)
- howToUse: how to activate/use it (optional)
- value: the headline value, e.g. "$200/year" (optional)
- tags: array of short keywords

Rules:
- Only include benefits clearly supported by the text. Do not invent anything.
- Exclude new cardmember/sign-up bonuses, introductory offers, APR, annual fees, credit-score or eligibility details, and generic marketing claims.
- Focus on ongoing benefits and protections a member can use.
- If a benefit matches one of the existing titles below, reuse that EXACT title so it can be matched.

Existing benefit titles: ${existingTitles.length > 0 ? existingTitles.join(" | ") : "(none)"}

Return ONLY JSON of the form {"benefits":[...]}.

Page text:
${text.slice(0, MAX_CHARS)}`,
  });

  const parsed = extractionSchema.safeParse(parseJson(output));
  if (!parsed.success) {
    throw new Error(
      `Model output did not match schema: ${parsed.error.message}`
    );
  }
  return parsed.data.benefits;
}

function normalize(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function similarity(a: string, b: string) {
  const aWords = new Set(normalize(a).split(" ").filter(Boolean));
  const bWords = new Set(normalize(b).split(" ").filter(Boolean));
  if (aWords.size === 0 || bWords.size === 0) {
    return 0;
  }
  let shared = 0;
  for (const word of aWords) {
    if (bWords.has(word)) {
      shared += 1;
    }
  }
  return shared / Math.max(aWords.size, bWords.size);
}

const MATCH_THRESHOLD = 0.5;

function findMatch<A extends { title: string }, B extends { title: string }>(
  row: A,
  candidates: { row: B; key: string }[]
): { row: B; key: string } | undefined {
  let best: { row: B; key: string } | undefined;
  let bestScore = 0;
  for (const candidate of candidates) {
    const score = similarity(row.title, candidate.row.title);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? best : undefined;
}

async function processProvider(slug: string, urls: string[]) {
  const [providerRow] = await db
    .select()
    .from(provider)
    .where(eq(provider.slug, slug))
    .limit(1);

  if (!providerRow) {
    console.warn(`  ! provider ${slug} not found in DB, skipping`);
    return;
  }

  const current = await db
    .select()
    .from(benefit)
    .where(eq(benefit.providerId, providerRow.id));

  const texts: string[] = [];
  for (const url of urls) {
    try {
      texts.push(await fetchText(url));
    } catch (error) {
      console.warn(`  ! ${url}: ${(error as Error).message}`);
    }
  }

  if (texts.length === 0) {
    console.warn(`  ! no pages fetched for ${slug}, skipping`);
    return;
  }

  const extracted = await extractBenefits(
    providerRow.name,
    texts.join("\n\n"),
    current.map((row) => row.title)
  );

  const currentCandidates = current.map((row) => ({
    key: normalize(row.title),
    row,
  }));
  const matchedCurrentIds = new Set<string>();
  const added: ExtractedBenefit[] = [];
  const changed: { existingTitle: string; proposed: ExtractedBenefit }[] = [];

  for (const row of extracted) {
    const match = findMatch(row, currentCandidates);
    if (!match) {
      added.push(row);
      continue;
    }
    matchedCurrentIds.add(match.row.id);
    if (
      match.row.summary.trim() !== row.summary.trim() ||
      match.row.details.trim() !== row.details.trim()
    ) {
      changed.push({ existingTitle: match.row.title, proposed: row });
    }
  }

  const missing = current.filter((row) => !matchedCurrentIds.has(row.id));

  const proposal = {
    changed,
    changes: {
      added: added.length,
      changed: changed.length,
      missing: missing.length,
    },
    currentBenefitCount: current.length,
    extractedBenefitCount: extracted.length,
    fetchedAt: new Date().toISOString(),
    missing: missing.map((row) => ({ id: row.id, title: row.title })),
    newBenefits: added,
    provider: providerRow.name,
    providerSlug: slug,
    sourceUrls: urls,
    status: "needs-review",
  };

  await mkdir(PROPOSALS_DIR, { recursive: true });
  const file = path.join(PROPOSALS_DIR, `${slug}.json`);
  await writeFile(file, `${JSON.stringify(proposal, null, 2)}\n`, "utf8");

  console.log(
    `  ${providerRow.name}: +${added.length} new, ~${changed.length} changed, ${missing.length} not found (${extracted.length} extracted)`
  );
  console.log(`    -> ${path.relative(process.cwd(), file)}`);
}

async function main() {
  const requested = process.argv.slice(2);
  const selected =
    requested.length > 0
      ? sources.filter((source) => requested.includes(source.slug))
      : sources;

  console.log(
    `Syncing benefit data for ${selected.length} provider(s) (proposals only, nothing is applied)...`
  );
  for (const source of selected) {
    console.log(`- ${source.slug}`);
    try {
      await processProvider(source.slug, source.urls);
    } catch (error) {
      console.warn(`  ! ${source.slug} failed: ${(error as Error).message}`);
    }
  }
  console.log("Done. Review files in lib/db/proposals/ before applying.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Sync failed");
  console.error(error);
  process.exit(1);
});
