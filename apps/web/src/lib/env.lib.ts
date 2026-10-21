import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.union([z.url(), z.string().startsWith("/")]),
});

type Env = {
  API_URL: string;
};

const env = envSchema.parse(import.meta.env);

export const ENV: Env = { API_URL: env.VITE_API_URL };
