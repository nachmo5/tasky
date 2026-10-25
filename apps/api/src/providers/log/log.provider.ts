import { inspect } from "node:util";
import pino from "pino";
import type { Providers } from "../types.provider.ts";

export class LogProvider {
  readonly logger: pino.Logger;
  constructor({ env }: Pick<Providers, "env">) {
    if (env.get("NODE_ENV") === "development") {
      this.logger = pino({
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
      });
    } else {
      this.logger = pino(); // JSON logs in production
    }
  }

  info(...args: unknown[]): void {
    this.log("info", args);
  }

  debug(...args: unknown[]): void {
    this.log("debug", args);
  }

  error(...args: unknown[]): void {
    this.log("error", args);
  }

  private log(level: "info" | "debug" | "error", args: unknown[]): void {
    if (!this.logger.isLevelEnabled(level)) return;

    const message = args
      .map((arg) => {
        if (typeof arg === "string") return arg;

        try {
          // Handles cycles and special types without running user-defined hooks.
          return inspect(arg, {
            colors: false,
            depth: 6,
            customInspect: false,
            getters: false,
          });
        } catch {
          return "[Uninspectable value]";
        }
      })
      .join(" ");

    this.logger[level](message);
  }
}
