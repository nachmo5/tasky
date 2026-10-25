export type CacheMap = {
  "login-attempts": { parts: [username: string]; value: number };
  "rate-limit": { parts: [route: string, id: string]; value: number };
};

export const CACHE_PREFIX_TO_TTL_S = {
  "login-attempts": 30 * 60, // 30 minutes
  "rate-limit": 1 * 60, // 1 minute
} as const satisfies Record<keyof CacheMap, number>;
