import { and, eq } from "drizzle-orm";
import { dbTaskTemplates } from "@repo/database";
import type { TaskTemplate, TaskTemplateUpdate } from "../../operations/types.operation.ts";
import { mapToTaskTemplate } from "./adapters.database.ts";
import type { DatabaseProvider } from "./database.provider.ts";

export function defineQueries(db: DatabaseProvider["client"]) {
  async function selectTaskTemplatesByIds(userId: string, ids: string[]): Promise<TaskTemplate[]> {
    const taskTemplateRows = await db.query.dbTaskTemplates.findMany({
      where: { userId, id: { in: ids } },
      with: { dbCompletedOccurrences: true },
      orderBy: { createdAt: "asc", id: "asc" },
    });
    return taskTemplateRows.map(mapToTaskTemplate);
  }

  return {
    selectTaskTemplates: async (userId: string): Promise<TaskTemplate[]> => {
      const taskTemplateRows = await db.query.dbTaskTemplates.findMany({
        where: { userId },
        with: { dbCompletedOccurrences: true },
        orderBy: { createdAt: "asc", id: "asc" },
      });
      return taskTemplateRows.map(mapToTaskTemplate);
    },
    selectTaskTemplatesByIds,
    updateTaskTemplates: async (userId: string, updates: TaskTemplateUpdate[]): Promise<TaskTemplate[]> => {
      await db.transaction(async (tx) => {
        for (const { id, changes } of updates) {
          await tx
            .update(dbTaskTemplates)
            .set(changes)
            .where(and(eq(dbTaskTemplates.id, id), eq(dbTaskTemplates.userId, userId)));
        }
      });
      return selectTaskTemplatesByIds(
        userId,
        updates.map((update) => update.id),
      );
    },
  };
}
