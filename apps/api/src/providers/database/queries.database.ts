import type { TaskTemplate } from "../../operations/types.operation.ts";
import { mapToTaskTemplate } from "./adapters.database.ts";
import type { DatabaseProvider } from "./database.provider.ts";

export function defineQueries(db: DatabaseProvider["client"]) {
  return {
    selectTaskTemplates: async (userId: string): Promise<TaskTemplate[]> => {
      const taskTemplateRows = await db.query.dbTaskTemplates.findMany({
        where: { userId },
        with: { dbCompletedOccurrences: true },
      });
      return taskTemplateRows.map(mapToTaskTemplate);
    },
  };
}
