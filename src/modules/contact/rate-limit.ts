import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export function contactRateLimitKey(ipHash: string, bucketStart: Date) {
  return createHash("sha256").update(`contact:${ipHash}:${bucketStart.toISOString()}`).digest("hex");
}

export async function consumeContactRateLimit(input: { ipHash: string; now: Date; windowSeconds: number; max: number }) {
  const windowMs = input.windowSeconds * 1000;
  const bucketStart = new Date(Math.floor(input.now.getTime() / windowMs) * windowMs);
  const keyHash = contactRateLimitKey(input.ipHash, bucketStart);
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { keyHash },
    create: { keyHash, bucketStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return { allowed: bucket.count <= input.max, remaining: Math.max(0, input.max - bucket.count) };
}
