import type { Providers } from "../providers/types.provider.ts";
import { TaskTemplateNotFoundError } from "./errors.operation.ts";
import type { TaskTemplate, TaskTemplateUpdate, User } from "./types.operation.ts";

export async function updateTaskTemplates(
  args: {
    updates: TaskTemplateUpdate[];
  },
  user: User,
  providers: Pick<Providers, "db">,
): Promise<TaskTemplate[]> {
  const { updates } = args;
  const ids = [...new Set(updates.map((update) => update.id))];
  const taskTemplates = await providers.db.queries.selectTaskTemplatesByIds(user.id, ids);
  if (taskTemplates.length !== ids.length) {
    throw new TaskTemplateNotFoundError();
  }
  return providers.db.queries.updateTaskTemplates(user.id, updates);
}
