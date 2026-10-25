import { drizzle } from "drizzle-orm/node-postgres";
export * from "./tables.ts";
export * from "./relations.ts";

export const DatabaseClient = drizzle;
