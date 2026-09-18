// biome-ignore-all lint/performance/noAwaitInLoops: sequential dump is intentional
import { writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./local.db",
});

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (value instanceof Uint8Array) {
    const hex = Array.from(value, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    return `X'${hex}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

const lines: string[] = [
  "-- Generated from local.db. Idempotent catalog seed for Cloudflare D1.",
  "-- Upserts providers and benefits by stable id and removes stale benefits;",
  "-- leaves user data untouched.",
];

const benefitRows = await client.execute("SELECT id FROM Benefit");
const benefitIds = benefitRows.rows.map((row) => sqlValue(row.id));
if (benefitIds.length > 0) {
  lines.push(`DELETE FROM Benefit WHERE id NOT IN (${benefitIds.join(", ")});`);
}

for (const table of ["Provider", "Benefit"] as const) {
  const result = await client.execute(`SELECT * FROM ${table}`);
  const { columns } = result;
  const updateColumns = columns.filter((column) => column !== "id");

  for (const row of result.rows) {
    const values = columns.map((column) => sqlValue(row[column]));
    const updates = updateColumns
      .map((column) => `${column}=excluded.${column}`)
      .join(", ");
    lines.push(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(
        ", "
      )}) ON CONFLICT(id) DO UPDATE SET ${updates};`
    );
  }
}

const relations = await client.execute("SELECT * FROM ProviderRelation");
lines.push("DELETE FROM ProviderRelation;");
for (const row of relations.rows) {
  const { columns } = relations;
  const values = columns.map((column) => sqlValue(row[column]));
  lines.push(
    `INSERT INTO ProviderRelation (${columns.join(
      ", "
    )}) VALUES (${values.join(", ")});`
  );
}

lines.push("");

writeFileSync("lib/db/seed.sql", lines.join("\n"), "utf8");
console.log(`Wrote lib/db/seed.sql (${lines.length} lines)`);
