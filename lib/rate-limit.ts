type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  current.count += 1;
  if (buckets.size > 5_000) {
    for (const [bucketKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  return {
    allowed: current.count <= options.limit,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
  };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}

export function requestIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
