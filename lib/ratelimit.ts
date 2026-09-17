import { env } from "cloudflare:workers";
import { ChatbotError } from "@/lib/errors";

/**
 * Per-IP rate limiting using Cloudflare's Rate Limiting binding
 * (`CHAT_RATE_LIMITER` in wrangler.jsonc). No-ops if the binding or IP is
 * unavailable (e.g. local dev without the binding).
 */
export async function checkIpRateLimit(ip: string | undefined) {
  const limiter = env.CHAT_RATE_LIMITER;

  if (!(limiter && ip)) {
    return;
  }

  try {
    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
  }
}
