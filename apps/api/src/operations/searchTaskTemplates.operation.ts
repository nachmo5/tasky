import type { Providers } from "../providers/types.provider.ts";
import type { TaskTemplate, User } from "./types.operation.ts";

export async function searchTaskTemplates(user: User, providers: Pick<Providers, "db">): Promise<TaskTemplate[]> {
  return providers.db.queries.selectTaskTemplates(user.id);
}
