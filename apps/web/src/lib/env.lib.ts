import { z } from "zod";

const envSchema = z.object({
  API_URL: z.url(),
});

export const ENV = envSchema.parse(import.meta.env);
