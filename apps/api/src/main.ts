import "dotenv/config";

import { asError } from "./config/errors.ts";
import { AuthProvider } from "./providers/auth/auth.provider.ts";
import { DatabaseProvider } from "./providers/database/database.provider.ts";
import { EnvProvider } from "./providers/env/env.provider.ts";
import { HttpProvider } from "./providers/http/http.provider.ts";
import { LogProvider } from "./providers/log/log.provider.ts";
import { CacheProvider } from "./providers/cache/cache.provider.ts";
import { CACHE_PREFIX_TO_TTL_S } from "./config/cache.ts";

const env = new EnvProvider();
const log = new LogProvider({ env });
const cache = new CacheProvider(CACHE_PREFIX_TO_TTL_S);
const db = new DatabaseProvider({ env });
const auth = new AuthProvider({ db, cache });
const http = new HttpProvider({ env, log, auth, db, cache });

http.start().catch((e) => log.error(`server stopped unexpectedly ${asError(e).message}`, e));

// ====================
// SHUT DOWN
// ====================
const SHUTDOWN_TIMEOUT_MS = 10_000;
let isShuttingDown = false;

// Stop accepting requests and let in-flight ones finish, then release the resources they use
async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log.info(`${signal} received, shutting down`);

  setTimeout(() => {
    log.error(`shutdown took more than ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    await http.stop();
    await db.close();
    await cache.close();
    log.info("shutdown complete");
    process.exit(0);
  } catch (e) {
    log.error(`shutdown failed ${asError(e).message}`, e);
    process.exit(1);
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, (s) => void shutdown(s));
}
