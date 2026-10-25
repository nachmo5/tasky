import { type LocalISO, toLocalISOString, type TimeInterval } from "@repo/lib";
import {
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  customType,
  smallint,
} from "drizzle-orm/pg-core";

function generateSharedColumns() {
  return {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  };
}

const localTimestamp = customType<{ data: LocalISO; driverData: string }>({
  dataType: () => "timestamp",
  fromDriver: toLocalISOString, // "2026-10-13 20:00:00" → "2026-10-13T20:00:00"
  toDriver: (v: LocalISO) => v, // Postgres accepts the T form
});

// ================================================================
// USERS ==========================================================
// ================================================================
export const dbUsers = pgTable("users", {
  ...generateSharedColumns(),
  name: text("name"),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const dbSessions = pgTable(
  "sessions",
  {
    ...generateSharedColumns(),
    userId: uuid("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

// ================================================================
// TASK_TEMPLATES =================================================
// ================================================================

export const dbTaskTemplates = pgTable("task_templates", {
  ...generateSharedColumns(),
  title: text("title").notNull(),
  description: text("description"),
  priority: smallint("priority").notNull().default(1),
  estimatedMn: doublePrecision("estimated_mn").notNull(),
  overdueAfter: jsonb("overdue_after").$type<TimeInterval>(),
  firstOccurrenceLocalStartDate: localTimestamp("first_occurrence_start_date").notNull(),
  nextOccurrenceEvery: jsonb("next_occurrence_every").$type<TimeInterval>(),
  tags: jsonb().default({}).$type<Record<string, string>>(),
  pinnedAt: timestamp("pinned_at", { withTimezone: true }),
  userId: uuid("user_id")
    .notNull()
    .references(() => dbUsers.id, { onDelete: "cascade" }),
});

// ================================================================
// TASK_OCCURRENCES ================================================
// ================================================================

export const dbCompletedOccurrences = pgTable(
  "completed_occurrences",
  {
    ...generateSharedColumns(),
    taskTemplateId: uuid("task_template_id")
      .notNull()
      .references(() => dbTaskTemplates.id, {
        onDelete: "cascade",
      }),
    localStartDate: localTimestamp("start_date").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    isCancelled: boolean("is_cancelled").notNull(),
  },
  (table) => [index("completed_occurrences_task_template_id_idx").on(table.taskTemplateId, table.localStartDate)],
);
