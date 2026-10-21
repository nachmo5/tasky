import type { Providers } from "../providers/types.provider.ts";
import type { NewTaskTemplate, TaskTemplate, User } from "./types.operation.ts";

export async function createTaskTemplate(
  args: {
    taskTemplate: NewTaskTemplate;
  },
  user: User,
  providers: Pick<Providers, "db">,
): Promise<TaskTemplate> {
  return providers.db.queries.insertTaskTemplate(user.id, args.taskTemplate);
}
