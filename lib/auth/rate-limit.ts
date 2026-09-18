import { env } from "cloudflare:workers";

export async function isAuthRateLimited(ip: string | undefined) {
  const limiter = env.AUTH_RATE_LIMITER;

  if (!(limiter && ip)) {
    return false;
  }

  try {
    const { success } = await limiter.limit({ key: ip });
    return !success;
  } catch {
    return false;
  }
}
