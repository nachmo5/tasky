import type { Task } from "@repo/dtos";
import type { TaskOccurence } from "../../operations/types.operation.ts";

export function taskOccurrenceToTask(taskOccurrence: TaskOccurence): Task {
  return {
    id: taskOccurrence.id,
    taskTemplateId: taskOccurrence.taskTemplate.id,
    startDate: taskOccurrence.localStartDate,
    dueDate: taskOccurrence.localDueDate,
    status: taskOccurrence.status,
    completedAt: taskOccurrence.completedAt?.toISOString() ?? null,
    title: taskOccurrence.taskTemplate.title,
    description: taskOccurrence.taskTemplate.description,
    priority: mapTaskPriority(taskOccurrence.taskTemplate.priority),
    estimatedMn: taskOccurrence.taskTemplate.estimatedMn,
    tags: taskOccurrence.taskTemplate.tags,
    firstOccurrenceStartDate: taskOccurrence.taskTemplate.firstOccurrenceLocalStartDate,
    nextOccurrenceEvery: taskOccurrence.taskTemplate.nextOccurrenceEvery,
    overdueAfter: taskOccurrence.taskTemplate.overdueAfter,
  };
}

function mapTaskPriority(priority: number): Task["priority"] {
  return ({ 0: "low", 1: "medium", 2: "high" }[priority] as Task["priority"]) ?? "high";
}
