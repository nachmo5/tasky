import { z } from "zod";
import { LocalISOSchema, TimeIntervalSchema, TimeZoneSchema } from "./shared/date.dto.ts";

// ===============================
// MODEL =========================
// ===============================

export const taskStatusEnumSchema = z.enum(["pending", "done", "cancelled"]);

export const taskPriorityEnumSchema = z.enum(["low", "medium", "high"]);

export const taskTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  priority: taskPriorityEnumSchema,
  estimatedMn: z.number(),
  tags: z.record(z.string(), z.string()),
  firstOccurrenceStartDate: LocalISOSchema,
  nextOccurrenceEvery: TimeIntervalSchema.nullable(),
  overdueAfter: TimeIntervalSchema.nullable(),
  pinnedAt: z.string().nullable(),
  completedOccurrences: z.array(
    z.object({
      localStartDate: LocalISOSchema,
      completedAt: z.string(),
      isCancelled: z.boolean(),
    }),
  ),
});

export type TaskTemplateDTO = z.infer<typeof taskTemplateSchema>;

export const taskOccurrenceSchema = z
  .object({
    id: z.string(),
    startDate: LocalISOSchema,
    dueDate: LocalISOSchema.nullable(),
    status: taskStatusEnumSchema,
    completedAt: z.string().nullable(),
    template: taskTemplateSchema,
  })
  .strict();

export type TaskOccurrenceDTO = z.infer<typeof taskOccurrenceSchema>;

// ================================
// ROUTES =========================
// ================================
export const searchTaskOccurrencesRequestSchema = z
  .object({
    from: LocalISOSchema,
    to: LocalISOSchema,
    timeZone: TimeZoneSchema,
  })
  .strict();

export type SearchTaskOccurrencesRequest = z.infer<typeof searchTaskOccurrencesRequestSchema>;

export const searchTaskOccurrencesResponseSchema = z.array(taskOccurrenceSchema);

export type SearchTaskOccurrencesResponse = z.infer<typeof searchTaskOccurrencesResponseSchema>;

export const searchTaskTemplatesRequestSchema = z
  .object({
    from: LocalISOSchema,
    to: LocalISOSchema,
    timeZone: TimeZoneSchema,
  })
  .strict();

export type SearchTaskTemplatesRequest = z.infer<typeof searchTaskTemplatesRequestSchema>;

export const searchTaskTemplatesResponseSchema = z.array(taskTemplateSchema);

export type SearchTaskTemplatesResponse = z.infer<typeof searchTaskTemplatesResponseSchema>;

export const taskTemplateChangesSchema = taskTemplateSchema
  .omit({ id: true })
  .partial()
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, "Expected at least one change");

export type TaskTemplateChangesDTO = z.infer<typeof taskTemplateChangesSchema>;
// =========
export const updateTaskTemplatesRequestSchema = z
  .object({
    updates: z
      .array(
        z
          .object({
            id: z.uuid(),
            changes: taskTemplateChangesSchema,
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type UpdateTaskTemplatesRequest = z.infer<typeof updateTaskTemplatesRequestSchema>;

export const updateTaskTemplatesResponseSchema = z.array(taskTemplateSchema);

export type UpdateTaskTemplatesResponse = z.infer<typeof updateTaskTemplatesResponseSchema>;

// =========
export const createTaskTemplateRequestSchema = taskTemplateSchema
  .omit({ id: true, completedOccurrences: true })
  .extend({ title: z.string().trim().min(1) })
  .strict();

export type CreateTaskTemplateRequest = z.infer<typeof createTaskTemplateRequestSchema>;

export const createTaskTemplateResponseSchema = taskTemplateSchema;

export type CreateTaskTemplateResponse = z.infer<typeof createTaskTemplateResponseSchema>;

// =========
export const deleteTaskTemplateRequestSchema = z.object({ id: z.string() }).strict();

export type DeleteTaskTemplateRequest = z.infer<typeof deleteTaskTemplateRequestSchema>;

export const deleteTaskTemplateResponseSchema = z.undefined();

export type DeleteTaskTemplateResponse = z.infer<typeof deleteTaskTemplateResponseSchema>;

// =========

export const completeTaskRequestSchema = z.object({ startDate: z.string(), taskTemplateId: z.string() }).strict();

export type CompleteTaskRequest = z.infer<typeof completeTaskRequestSchema>;

export const completeTaskResponseSchema = z.undefined();

export type CompleteTaskResponse = z.infer<typeof completeTaskResponseSchema>;
