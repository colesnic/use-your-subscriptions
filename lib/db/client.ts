import "server-only";

import { env } from "cloudflare:workers";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";

const globalForDb = globalThis as unknown as {
  __chatbotDb?: DrizzleD1Database;
};

export const db: DrizzleD1Database = globalForDb.__chatbotDb ?? drizzle(env.DB);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__chatbotDb = db;
}
