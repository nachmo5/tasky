import type { CreateTaskTemplateRequest, TaskOccurrenceDTO, TaskTemplateChangesDTO, TaskTemplateDTO } from "@repo/dtos";
import type {
  NewTaskTemplate,
  TaskOccurrence,
  TaskTemplate,
  TaskTemplateChanges,
} from "../../operations/types.operation.ts";

export function taskOccurrenceToDTO(taskOccurrence: TaskOccurrence): TaskOccurrenceDTO {
  return {
    id: taskOccurrence.id,
    startDate: taskOccurrence.localStartDate,
    dueDate: taskOccurrence.localDueDate,
    status: taskOccurrence.status,
    completedAt: taskOccurrence.completedAt?.toISOString() ?? null,
    template: taskTemplateToDTO(taskOccurrence.taskTemplate),
  };
}

export function taskTemplateToDTO(taskTemplate: TaskTemplate): TaskTemplateDTO {
  return {
    id: taskTemplate.id,
    title: taskTemplate.title,
    description: taskTemplate.description,
    priority: mapTaskPriority(taskTemplate.priority),
    estimatedMn: taskTemplate.estimatedMn,
    tags: taskTemplate.tags,
    firstOccurrenceStartDate: taskTemplate.firstOccurrenceLocalStartDate,
    nextOccurrenceEvery: taskTemplate.nextOccurrenceEvery,
    overdueAfter: taskTemplate.overdueAfter,
    pinnedAt: taskTemplate.pinnedAt?.toISOString() ?? null,
    completedOccurrences: taskTemplate.completedOccurrences.map((co) => ({
      ...co,
      completedAt: co.completedAt.toISOString(),
    })),
  };
}

export function taskTemplateChangesFromDTO(changes: TaskTemplateChangesDTO): TaskTemplateChanges {
  const {
    priority,
    firstOccurrenceStartDate,
    pinnedAt,
    completedOccurrences: _completedOccurrences,
    ...sameNameChanges
  } = changes;
  return {
    ...sameNameChanges,
    ...(priority ? { priority: mapTaskPriorityToNumber(priority) } : {}),
    ...(firstOccurrenceStartDate ? { firstOccurrenceLocalStartDate: firstOccurrenceStartDate } : {}),
    ...(pinnedAt !== undefined ? { pinnedAt: pinnedAt === null ? null : new Date(pinnedAt) } : {}),
  };
}

export function mapToNewTaskTemplate(taskTemplate: CreateTaskTemplateRequest): NewTaskTemplate {
  const { priority, firstOccurrenceStartDate, ...sameNameFields } = taskTemplate;
  return {
    ...sameNameFields,
    priority: mapTaskPriorityToNumber(priority),
    pinnedAt: null,
    firstOccurrenceLocalStartDate: firstOccurrenceStartDate,
  };
}

function mapTaskPriority(priority: number): TaskTemplateDTO["priority"] {
  return ({ 0: "low", 1: "medium", 2: "high" }[priority] as TaskTemplateDTO["priority"]) ?? "high";
}

function mapTaskPriorityToNumber(priority: TaskTemplateDTO["priority"]): number {
  return { low: 0, medium: 1, high: 2 }[priority];
}
