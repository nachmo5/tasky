import { type LocalISO } from "@repo/lib";
import type { Providers } from "../providers/types.provider.ts";
import type { User } from "./types.operation.ts";

export async function completeTask(
  args: {
    localStartDate: LocalISO;
    taskTemplateId: string;
  },
  _user: User,
  providers: Pick<Providers, "db">,
): Promise<void> {
  await providers.db.queries.insertCompletedOccurrence({
    taskTemplateId: args.taskTemplateId,
    localStartDate: args.localStartDate,
    completedAt: new Date(),
    isCancelled: false,
  });
}
