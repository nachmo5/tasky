import { objectEntries } from "@repo/lib";
import { safeParseJson } from "../../lib/json.ts";

export class CacheProvider<TCacheMap extends Record<string, { parts: string[]; value: unknown }>> {
  private cache: Record<string, { value: string; expiresAt: number | null }> = {};
  private cachePrefixToTTLSeconds: Record<keyof TCacheMap, number>;
  private expiryInterval = setInterval(() => this.removeExpired(), 60_000);

  constructor(cachePrefixToTTLSeconds: Record<keyof TCacheMap, number>) {
    this.expiryInterval.unref();
    this.cachePrefixToTTLSeconds = cachePrefixToTTLSeconds;
  }

  get<TPrefix extends keyof TCacheMap>(
    prefix: TPrefix,
    parts: TCacheMap[TPrefix]["parts"],
  ): Promise<TCacheMap[TPrefix]["value"] | null> {
    const key = generateCacheKey(prefix as string, parts);
    const entry = this.cache[key];
    if (!entry) return Promise.resolve(null);
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      delete this.cache[key];
      return Promise.resolve(null);
    }
    const raw = entry?.value;
    return Promise.resolve(raw === undefined ? null : (safeParseJson(raw) as unknown as TCacheMap[TPrefix]["value"]));
  }

  set<TPrefix extends keyof TCacheMap>(
    prefix: TPrefix,
    parts: TCacheMap[TPrefix]["parts"],
    value: TCacheMap[TPrefix]["value"],
  ): Promise<void> {
    const expiresAt = this.computeExpiresAt(prefix, Date.now());
    this.cache[generateCacheKey(prefix as string, parts)] = { value: JSON.stringify(value), expiresAt };
    return Promise.resolve();
  }

  delete<TPrefix extends keyof TCacheMap>(prefix: TPrefix, parts: TCacheMap[TPrefix]["parts"]): Promise<void> {
    delete this.cache[generateCacheKey(prefix as string, parts)];
    return Promise.resolve();
  }

  removeExpired() {
    objectEntries(this.cache).map(([key, entry]) => {
      if (entry.expiresAt && entry.expiresAt < new Date().getTime()) {
        delete this.cache[key];
      }
    });
  }

  // necessary for concurrency issues
  increment<TPrefix extends keyof TCacheMap>(
    prefix: TPrefix,
    parts: TCacheMap[TPrefix]["parts"],
    ttlMs?: number,
  ): Promise<{ count: number; ttlMs: number }> {
    const key = generateCacheKey(prefix as string, parts);
    const now = Date.now();
    const entry = this.cache[key];
    const isEntryActive = entry !== undefined && (entry.expiresAt === null || entry.expiresAt > now);
    const count = (isEntryActive ? Number(safeParseJson(entry.value)) : 0) + 1;
    const expiresAt = isEntryActive ? entry.expiresAt : this.computeExpiresAt(prefix, now, ttlMs);
    this.cache[key] = { value: JSON.stringify(count), expiresAt };
    return Promise.resolve({ count, ttlMs: expiresAt === null ? -1 : expiresAt - now });
  }

  private computeExpiresAt(prefix: keyof TCacheMap, now: number, ttlMs?: number): number | null {
    if (ttlMs !== undefined) return now + ttlMs;
    const ttlS = this.cachePrefixToTTLSeconds[prefix];
    return ttlS > 0 ? now + ttlS * 1000 : null;
  }

  close(): Promise<void> {
    clearInterval(this.expiryInterval);
    return Promise.resolve();
  }
}

function generateCacheKey(prefix: string, parts: string[]) {
  return `${prefix}:${parts.map(encodeURIComponent).join(":")}`;
}
