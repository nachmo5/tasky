import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { getTableName, type InferInsertModel, type Table } from "drizzle-orm/table";
import { Pool } from "pg";
import { dbSessions, dbTaskTemplates, dbUsers } from "./tables.ts";

await applySeeds();

// ===========================================
// SEEDS =====================================
// ===========================================

function generateSeeds() {
  const USERNAME = "a@b.com";
  const PASSWORD_HASH =
    "scrypt$131072$8$1$nKwa5p34dbEjTyjNgLp81g==$k0cY/Yaq5orRcXgPfb1fBgsLyhjxHWwnDyghVGKWP5rBuJWIWk/NJsEXI6yKizcHmvBhHVSfDe3QN9KdxbU7sA=="; // "123"

  const userSeed = defineSeed(dbUsers, [
    {
      id: "00000000-0000-4000-8000-000000000001",
      username: USERNAME,
      name: "Demo User",
      passwordHash: PASSWORD_HASH,
    },
  ]);

  const sessionSeed = defineSeed(dbSessions, [
    {
      id: "00000000-0000-4000-8000-000000000001",
      expiresAt: new Date(2028, 1, 1),
      userId: userSeed.data[0]!.id,
    },
  ]);

  const taskTemplateSeed = defineSeed(dbTaskTemplates, [
    // Recurrent: a new occurrence every week
    {
      id: "00000000-0000-4000-8000-000000000001",
      title: "Water the plants",
      description: "Living room and balcony",
      priority: 1,
      estimatedMn: 10,
      overdueAfter: { count: 1, unit: "days" },
      firstOccurrenceLocalStartDate: "2026-10-19T09:00:00",
      nextOccurrenceEvery: { count: 7, unit: "days" },
      tags: { category: "home" },
      userId: userSeed.data[0]!.id,
    },
    // One shot: no nextOccurrenceEvery
    {
      id: "00000000-0000-4000-8000-000000000002",
      title: "Renew passport",
      description: "Book an appointment at the town hall",
      priority: 2,
      estimatedMn: 60,
      overdueAfter: { count: 1, unit: "months" },
      firstOccurrenceLocalStartDate: "2026-11-02T10:00:00",
      nextOccurrenceEvery: null,
      tags: { category: "admin" },
      userId: userSeed.data[0]!.id,
    },
  ]);

  return [userSeed, sessionSeed, taskTemplateSeed];
}

// ===========================================
// UTILS =====================================
// ===========================================
async function applySeeds() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const db = drizzle({ client: pool });
    await db.transaction(async (tx) => {
      for (const seed of generateSeeds()) {
        console.log("inserting seed data for table:", getTableName(seed.table));
        await tx.insert(seed.table).values(seed.data).onConflictDoNothing();
        console.log("inserted seed data for table:", getTableName(seed.table));
      }
    });
  } finally {
    await pool.end();
  }
}

function defineSeed<TTable extends Table, TData extends InferInsertModel<TTable>[]>(
  table: TTable,
  data: TData,
): { data: TData; table: TTable } {
  return { table, data };
}
