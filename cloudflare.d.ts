// Provided by the Cloudflare Workers runtime; types come from `wrangler types`.
declare module "cloudflare:workers" {
  export const env: {
    DB: Parameters<typeof import("drizzle-orm/d1").drizzle>[0];
    CHAT_RATE_LIMITER?: {
      limit: (options: { key: string }) => Promise<{ success: boolean }>;
    };
    [key: string]: unknown;
  };
}
