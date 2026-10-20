import type { LocalISO, TimeInterval } from "@repo/lib";

export type TaskTemplate = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: number;
  estimatedMn: number;
  overdueAfter: TimeInterval | null;
  firstOccurrenceLocalStartDate: LocalISO;
  nextOccurrenceEvery: TimeInterval | null;
  tags: Record<string, string>;
  completedOccurrences: CompletedOccurrence[];
};

export type TaskTemplateChanges = Partial<
  Pick<
    TaskTemplate,
    | "title"
    | "description"
    | "priority"
    | "estimatedMn"
    | "overdueAfter"
    | "firstOccurrenceLocalStartDate"
    | "nextOccurrenceEvery"
    | "tags"
  >
>;

export type TaskTemplateUpdate = {
  id: string;
  changes: TaskTemplateChanges;
};

type CompletedOccurrence = {
  localStartDate: LocalISO;
  completedAt: Date;
  isCancelled: boolean;
};

export type TaskOccurrence = {
  id: string;
  status: "pending" | "overdue" | "done" | "cancelled";
  localStartDate: LocalISO;
  localDueDate: LocalISO | null;
  taskTemplate: TaskTemplate;
  completedAt: Date | null;
};

export type User = {
  id: string;
  name: string | null;
};
