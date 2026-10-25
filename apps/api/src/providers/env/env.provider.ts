import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  WEB_URL: z.url(),
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(["production", "development", "test"]).default("development"),
});

type EnvSchema = z.infer<typeof envSchema>;

export class EnvProvider {
  data: EnvSchema;

  constructor() {
    try {
      this.data = envSchema.parse(process.env);
    } catch (err) {
      console.error("Invalid environment variables", err);
      process.exit(1);
    }
  }

  get<K extends keyof EnvSchema>(name: K): EnvSchema[K] {
    return this.data[name];
  }
}
