import type { Providers } from "../providers/types.provider.ts";
import type { User } from "./types.operation.ts";

export async function deleteTaskTemplate(
  args: {
    id: string;
  },
  user: User,
  providers: Pick<Providers, "db">,
): Promise<void> {
  await providers.db.queries.deleteTaskTemplate(user.id, args.id);
}
