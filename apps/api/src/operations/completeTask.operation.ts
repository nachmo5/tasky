import { type LocalISO } from "@repo/lib";
import type { Providers } from "../providers/types.provider.ts";
import type { User } from "./types.operation.ts";
import { TaskTemplateNotFoundError } from "./errors.operation.ts";

export async function completeTask(
  args: {
    localStartDate: LocalISO;
    taskTemplateId: string;
  },
  user: User,
  providers: Pick<Providers, "db">,
): Promise<void> {
  const owned = await providers.db.queries.selectTaskTemplatesByIds(user.id, [args.taskTemplateId]);
  if (owned.length === 0) {
    throw new TaskTemplateNotFoundError();
  }
  await providers.db.queries.insertCompletedOccurrence({
    taskTemplateId: args.taskTemplateId,
    localStartDate: args.localStartDate,
    completedAt: new Date(),
    isCancelled: false,
  });
}
