import type { dbTaskTemplates, dbCompletedOccurrences } from "@repo/database";
import type { TaskTemplate } from "../../operations/types.operation.ts";

export function mapToTaskTemplate(
  taskTemplateRow: typeof dbTaskTemplates.$inferSelect & {
    dbCompletedOccurrences: (typeof dbCompletedOccurrences.$inferSelect)[];
  },
): TaskTemplate {
  return {
    id: taskTemplateRow.id,
    userId: taskTemplateRow.userId,
    title: taskTemplateRow.title,
    description: taskTemplateRow.description,
    priority: taskTemplateRow.priority,
    estimatedMn: taskTemplateRow.estimatedMn,
    overdueAfter: taskTemplateRow.overdueAfter,
    firstOccurrenceLocalStartDate: taskTemplateRow.firstOccurrenceLocalStartDate,
    nextOccurrenceEvery: taskTemplateRow.nextOccurrenceEvery,
    tags: taskTemplateRow.tags ?? {},
    pinnedAt: taskTemplateRow.pinnedAt,
    completedOccurrences: taskTemplateRow.dbCompletedOccurrences.map((completedOccurrence) => ({
      localStartDate: completedOccurrence.localStartDate,
      completedAt: completedOccurrence.completedAt,
      isCancelled: completedOccurrence.isCancelled,
    })),
  };
}
