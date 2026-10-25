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
    const expiresAt =
      this.cachePrefixToTTLSeconds[prefix] > 0
        ? new Date().getTime() + this.cachePrefixToTTLSeconds[prefix] * 1000
        : null;
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
    const entry = this.cache[key];
    const value = entry ? safeParseJson(entry?.value) : 0;
    const nextValue = (value ? Number(value) : 0) + 1;
    const expiresAt = ttlMs != null ? Date.now() + ttlMs : (entry?.expiresAt ?? null);
    this.cache[key] = {
      value: JSON.stringify(nextValue),
      expiresAt,
    };
    return Promise.resolve({ count: nextValue, ttlMs: expiresAt === null ? -1 : expiresAt - Date.now() });
  }

  close(): Promise<void> {
    clearInterval(this.expiryInterval);
    return Promise.resolve();
  }
}

function generateCacheKey(prefix: string, parts: string[]) {
  return `${prefix}:${parts.map(encodeURIComponent).join(":")}`;
}
