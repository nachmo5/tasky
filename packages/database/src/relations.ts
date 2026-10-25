import { defineRelations } from "drizzle-orm";
import { dbTaskTemplates, dbCompletedOccurrences, dbUsers, dbSessions } from "./tables.ts";

export const dbRelations = defineRelations({ dbTaskTemplates, dbCompletedOccurrences, dbUsers, dbSessions }, (r) => ({
  dbCompletedOccurrences: {
    dbTaskTemplate: r.one.dbTaskTemplates({
      from: r.dbCompletedOccurrences.taskTemplateId,
      to: r.dbTaskTemplates.id,
    }),
  },
  dbTaskTemplates: {
    dbCompletedOccurrences: r.many.dbCompletedOccurrences(),
  },
  dbSessions: {
    dbUser: r.one.dbUsers({
      from: r.dbSessions.userId,
      to: r.dbUsers.id,
      optional: false,
    }),
  },
}));
