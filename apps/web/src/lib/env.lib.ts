import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.url(),
});

type Env = {
  API_URL: string;
};

const env = envSchema.parse(import.meta.env);

export const ENV: Env = { API_URL: env.VITE_API_URL };
