import { z } from "zod";
import { LocalISOSchema, TimeIntervalSchema } from "./shared/date.dto.ts";

// ===============================
// MODEL =========================
// ===============================

export const taskStatusEnumSchema = z.enum(["pending", "overdue", "done", "cancelled"]);

export const taskPriorityEnumSchema = z.enum(["low", "medium", "high"]);

export const taskSchema = z
  .object({
    // occurrence
    id: z.string(),
    taskTemplateId: z.string(),
    startDate: LocalISOSchema,
    dueDate: LocalISOSchema.nullable(),
    status: taskStatusEnumSchema,
    completedAt: z.string().nullable(),
    // template
    title: z.string(),
    description: z.string().nullable(),
    priority: taskPriorityEnumSchema,
    estimatedMn: z.number(),
    tags: z.record(z.string(), z.string()),
    firstOccurrenceStartDate: LocalISOSchema,
    nextOccurrenceEvery: TimeIntervalSchema.nullable(),
    overdueAfter: TimeIntervalSchema.nullable(),
  })
  .strict();

export type Task = z.infer<typeof taskSchema>;

// ================================
// ROUTES =========================
// ================================
export const searchTasksRequestSchema = z
  .object({
    from: LocalISOSchema,
    to: LocalISOSchema,
    timeZone: z.string(),
  })
  .strict();

export type SearchTasksRequest = z.infer<typeof searchTasksRequestSchema>;

export const searchTasksResponseSchema = z.array(taskSchema);

export type SearchTasksResponse = z.infer<typeof searchTasksResponseSchema>;
