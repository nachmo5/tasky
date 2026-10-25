import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
export * from "./tables.ts";
export * from "./relations.ts";

export const DatabaseClient: typeof drizzle = drizzle;

export async function verifyDatabaseConnection(client: NodePgDatabase) {
  await client.execute(sql`SELECT 1 AS connected`);
}
