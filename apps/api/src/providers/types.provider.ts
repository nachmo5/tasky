import type { CacheMap } from "../config/cache.ts";
import type { AuthProvider } from "./auth/auth.provider.ts";
import type { CacheProvider } from "./cache/cache.provider.ts";
import type { DatabaseProvider } from "./database/database.provider.ts";
import type { EnvProvider } from "./env/env.provider.ts";
import type { LogProvider } from "./log/log.provider.ts";

export type Providers = {
  cache: CacheProvider<CacheMap>;
  auth: AuthProvider;
  log: LogProvider;
  env: EnvProvider;
  db: DatabaseProvider;
};
