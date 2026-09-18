import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./local.db",
});

const BLOCKED_DOMAINS = [
  "nerdwallet.com",
  "thepointsguy.com",
  "reddit.com",
  "doctorofcredit.com",
  "frequentmiler.com",
  "upgradedpoints.com",
  "bankrate.com",
  "creditkarma.com",
  "medium.com",
];

function registrableDomain(host: string) {
  const parts = host.replace(/^www\./, "").split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : host;
}

function hostOf(url: string | null) {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

type Row = {
  id: string;
  title: string;
  monetaryValue: number | null;
  valuePeriod: string | null;
  resetFrequency: string | null;
  restrictions: string | null;
  officialUrl: string | null;
  lastVerifiedAt: number | null;
  providerName: string;
  providerWebsite: string | null;
};

const result = await client.execute(
  `SELECT b.id, b.title, b.monetaryValue, b.valuePeriod, b.resetFrequency,
          b.restrictions, b.officialUrl, b.lastVerifiedAt,
          p.name AS providerName, p.website AS providerWebsite
   FROM Benefit b JOIN Provider p ON p.id = b.providerId`
);

const rows = result.rows as unknown as Row[];
const nowSeconds = Math.floor(Date.now() / 1000);
const ninetyDaysAgo = nowSeconds - 90 * 86_400;

const failures: string[] = [];
const warnings: string[] = [];

let withValue = 0;
let withSource = 0;
let withRestrictions = 0;
let verifiedRecently = 0;
let withReset = 0;

for (const row of rows) {
  const hasValue = row.monetaryValue !== null;
  if (hasValue) {
    withValue += 1;
  }
  if (row.officialUrl) {
    withSource += 1;
  }
  if (row.restrictions) {
    withRestrictions += 1;
  }
  if (row.lastVerifiedAt && row.lastVerifiedAt >= ninetyDaysAgo) {
    verifiedRecently += 1;
  }
  if (row.resetFrequency && row.resetFrequency !== "none") {
    withReset += 1;
  }

  if (hasValue && !row.valuePeriod) {
    failures.push(`${row.id}: monetaryValue set but valuePeriod is null`);
  }
  if (hasValue && !row.lastVerifiedAt) {
    failures.push(`${row.id}: monetaryValue set but lastVerifiedAt is null`);
  }
  if (hasValue && row.monetaryValue !== null && row.monetaryValue < 0) {
    failures.push(`${row.id}: monetaryValue is negative`);
  }
  if (
    hasValue &&
    ["monthly", "quarterly", "semiannual"].includes(row.resetFrequency ?? "") &&
    row.valuePeriod === "annual"
  ) {
    warnings.push(
      `${row.id}: resetFrequency=${row.resetFrequency} but valuePeriod=annual`
    );
  }

  const host = hostOf(row.officialUrl);
  if (host) {
    if (BLOCKED_DOMAINS.some((domain) => host.endsWith(domain))) {
      failures.push(
        `${row.id}: officialUrl points to a non-provider domain (${host})`
      );
    } else {
      const providerHost = hostOf(
        row.providerWebsite?.startsWith("http")
          ? row.providerWebsite
          : `https://${row.providerWebsite ?? ""}`
      );
      if (
        providerHost &&
        registrableDomain(host) !== registrableDomain(providerHost)
      ) {
        warnings.push(
          `${row.id}: officialUrl domain (${host}) differs from provider (${providerHost})`
        );
      }
    }
  }
}

console.log(`Total benefits: ${rows.length}`);
console.log(`With monetary value: ${withValue}`);
console.log(`With official source: ${withSource}`);
console.log(`With restrictions: ${withRestrictions}`);
console.log(`With reset frequency: ${withReset}`);
console.log(`Verified in last 90 days: ${verifiedRecently}`);
console.log(
  `Missing value period: ${
    rows.filter((row) => row.monetaryValue !== null && !row.valuePeriod).length
  }`
);
console.log(`Suspicious records: ${warnings.length}`);
console.log(`Data-integrity failures: ${failures.length}`);

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

if (failures.length > 0) {
  console.log("\nFailures:");
  for (const failure of failures) {
    console.log(`  - ${failure}`);
  }
  process.exit(1);
}
