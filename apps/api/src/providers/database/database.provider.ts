import { DatabaseClient, dbRelations, verifyDatabaseConnection } from "@repo/database";
import type { Providers } from "../types.provider.ts";
import { defineQueries } from "./queries.database.ts";

export class DatabaseProvider {
  client;
  queries;
  constructor({ env }: Pick<Providers, "env">) {
    this.client = DatabaseClient(env.get("DATABASE_URL"), { relations: dbRelations });
    this.queries = defineQueries(this.client);
  }

  async verifyConnection() {
    try {
      await verifyDatabaseConnection(this.client);
    } catch (e: unknown) {
      throw new Error("Could not connect to the database ", { cause: e });
    }
  }

  async close(): Promise<void> {
    await this.client.$client.end();
  }
}
