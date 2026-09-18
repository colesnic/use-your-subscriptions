// biome-ignore-all lint/performance/noAwaitInLoops: sequential provider sync is intentional
/**
 * Weekly benefits sync Worker.
 *
 * Runs every Sunday (see wrangler.jsonc crons), fetches the official page for a
 * rotating batch of providers, asks the model to extract the current benefits,
 * diffs them against D1, and stores reviewable proposals. Nothing is applied
 * automatically.
 *
 * Manual trigger: GET /run with `Authorization: Bearer <SYNC_TOKEN>`
 * List proposals: GET /proposals with `Authorization: Bearer <SYNC_TOKEN>`
 */

interface Env {
  DB: D1Database;
  DEEPSEEK_API_KEY: string;
  SYNC_TOKEN?: string;
}

type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  website: string;
};

type BenefitRow = {
  id: string;
  title: string;
  summary: string;
  details: string;
};

type ExtractedBenefit = {
  title: string;
  category: string;
  summary: string;
  details: string;
  howToUse?: string;
  value?: string;
  tags?: string[];
};

const MAX_PROVIDERS_PER_RUN = 12;
const MAX_CHARS = 40_000;
const MATCH_THRESHOLD = 0.5;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function isSafeFetchUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname.startsWith("[") || hostname.includes(":")) {
    return false;
  }
  if (/^\d+(\.\d+){3}$/.test(hostname)) {
    return false;
  }
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }

  return true;
}

async function fetchText(url: string): Promise<string> {
  if (!isSafeFetchUrl(url)) {
    throw new Error("refusing to fetch unsafe url");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`fetch ${url} -> ${response.status}`);
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

function parseJson(text: string): { benefits?: unknown } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return {};
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return {};
  }
}

async function extractBenefits(
  apiKey: string,
  providerName: string,
  text: string,
  existingTitles: string[]
): Promise<ExtractedBenefit[]> {
  const prompt = `You extract structured benefits data for the "${providerName}" program.

From the page text below, list the concrete benefits and perks a member gets. For each return:
- title, category (car_rental, travel, dining, shopping, lounge, insurance, security, streaming, everyday or rewards), summary, details, howToUse (optional), value (optional), tags (array)

Rules:
- Only include benefits supported by the text. Do not invent anything.
- Exclude sign-up bonuses, APR, annual fees, and generic marketing claims.
- If a benefit matches one of the existing titles, reuse that exact title.

Existing titles: ${existingTitles.length > 0 ? existingTitles.join(" | ") : "(none)"}

Return ONLY JSON of the form {"benefits":[...]}.

Page text:
${text.slice(0, MAX_CHARS)}`;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    body: JSON.stringify({
      messages: [{ content: prompt, role: "user" }],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`deepseek ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  const parsed = parseJson(content);
  const rawBenefits = Array.isArray(parsed.benefits) ? parsed.benefits : [];
  return rawBenefits.filter(
    (item): item is ExtractedBenefit =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ExtractedBenefit).title === "string" &&
      typeof (item as ExtractedBenefit).summary === "string" &&
      typeof (item as ExtractedBenefit).details === "string"
  );
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

function diffBenefits(current: BenefitRow[], extracted: ExtractedBenefit[]) {
  const added: ExtractedBenefit[] = [];
  const changed: { existingTitle: string; proposed: ExtractedBenefit }[] = [];
  const matched = new Set<string>();

  for (const row of extracted) {
    let best: BenefitRow | undefined;
    let bestScore = 0;
    for (const candidate of current) {
      const score = similarity(row.title, candidate.title);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (!best || bestScore < MATCH_THRESHOLD) {
      added.push(row);
      continue;
    }

    matched.add(best.id);
    if (
      best.summary.trim() !== row.summary.trim() ||
      best.details.trim() !== row.details.trim()
    ) {
      changed.push({ existingTitle: best.title, proposed: row });
    }
  }

  const missing = current.filter((row) => !matched.has(row.id));
  return { added, changed, missing };
}

async function syncProvider(env: Env, provider: ProviderRow) {
  const text = await fetchText(provider.website);

  const current = await env.DB.prepare(
    "SELECT id, title, summary, details FROM Benefit WHERE providerId = ?1"
  )
    .bind(provider.id)
    .all<BenefitRow>();

  const extracted = await extractBenefits(
    env.DEEPSEEK_API_KEY,
    provider.name,
    text,
    current.results.map((row) => row.title)
  );

  const { added, changed, missing } = diffBenefits(current.results, extracted);

  if (added.length > 0 || changed.length > 0 || missing.length > 0) {
    await env.DB.prepare(
      `INSERT INTO BenefitProposal
        (id, providerId, providerName, providerSlug, sourceUrl, fetchedAt, added, changed, missing, payload, status, createdAt)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'needs-review', ?11)`
    )
      .bind(
        crypto.randomUUID(),
        provider.id,
        provider.name,
        provider.slug,
        provider.website,
        nowSeconds(),
        added.length,
        changed.length,
        missing.length,
        JSON.stringify({
          added,
          changed,
          missing,
          sourceUrl: provider.website,
        }),
        nowSeconds()
      )
      .run();
  }

  await env.DB.prepare("UPDATE Provider SET lastCheckedAt = ?1 WHERE id = ?2")
    .bind(nowSeconds(), provider.id)
    .run();

  return {
    added: added.length,
    changed: changed.length,
    missing: missing.length,
    slug: provider.slug,
  };
}

async function run(env: Env) {
  const providers = await env.DB.prepare(
    `SELECT id, name, slug, website FROM Provider
     WHERE website IS NOT NULL
     ORDER BY lastCheckedAt IS NULL DESC, lastCheckedAt ASC
     LIMIT ?1`
  )
    .bind(MAX_PROVIDERS_PER_RUN)
    .all<ProviderRow>();

  const results: unknown[] = [];

  for (const provider of providers.results) {
    try {
      results.push(await syncProvider(env, provider));
    } catch (error) {
      results.push({ error: String(error), slug: provider.slug });
    }
  }

  return results;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function authorized(request: Request, env: Env) {
  const token = env.SYNC_TOKEN;
  if (!token) {
    return false;
  }

  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;

  if (!provided) {
    return false;
  }

  return timingSafeEqual(provided, token);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (!authorized(request, env)) {
      return new Response("unauthorized", { status: 401 });
    }

    if (pathname === "/run") {
      return Response.json(await run(env));
    }

    if (pathname === "/proposals") {
      const rows = await env.DB.prepare(
        `SELECT id, providerName, providerSlug, added, changed, missing, status, fetchedAt
         FROM BenefitProposal ORDER BY fetchedAt DESC LIMIT 50`
      ).all();
      return Response.json(rows.results);
    }

    return new Response("not found", { status: 404 });
  },
  scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(run(env));
  },
};
