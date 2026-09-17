import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  const url = process.env.DATABASE_URL ?? "file:./local.db";

  const client = createClient({
    authToken: process.env.DATABASE_AUTH_TOKEN,
    url,
  });
  const db = drizzle(client);

  console.log(`Running migrations against ${url}...`);

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});
