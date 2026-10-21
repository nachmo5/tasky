import type { TaskOccurrenceDTO, TaskTemplateDTO } from "@repo/dtos";
import { DAY_TO_MS, HOUR_TO_MS, MINUTE_TO_MS, toTimestamp } from "@repo/lib";

export type TaskOccurrenceListItem = {
  taskOccurrence: TaskOccurrenceDTO;
  timeToDueMs: number | null;
};

export function autoSortTaskOccurrences(
  taskOccurrences: TaskOccurrenceDTO[],
  now: number,
  timeZone: string,
): TaskOccurrenceListItem[] {
  return taskOccurrences
    .map((taskOccurrence) => {
      const dueTimestamp = taskOccurrence.dueDate ? toTimestamp(taskOccurrence.dueDate, timeZone) : Infinity;
      return {
        taskOccurrence,
        dueTimestamp,
        priorityLevel: computeEffectivePriorityLevel(taskOccurrence.template, dueTimestamp, now),
        nbOfDaysLeft: computeNbOfDaysLeft(dueTimestamp, now),
        score: computeScore(taskOccurrence.template, dueTimestamp, now),
      };
    })
    .toSorted(
      (first, second) =>
        second.priorityLevel - first.priorityLevel ||
        compareNbOfDaysLeft(first.nbOfDaysLeft, second.nbOfDaysLeft) ||
        second.score - first.score ||
        first.dueTimestamp - second.dueTimestamp ||
        first.taskOccurrence.template.title.localeCompare(second.taskOccurrence.template.title),
    )
    .map(({ taskOccurrence, dueTimestamp }) => ({
      taskOccurrence,
      timeToDueMs: Number.isFinite(dueTimestamp) ? dueTimestamp - now : null,
    }));
}

function computeEffectivePriorityLevel(template: TaskTemplateDTO, dueTimestamp: number, now: number) {
  const PRIORITY_LEVEL: Record<TaskTemplateDTO["priority"], number> = { low: 0, medium: 1, high: 2 };
  const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000;
  const isUrgent = dueTimestamp - now <= URGENT_THRESHOLD_MS;
  return PRIORITY_LEVEL[template.priority] + (isUrgent ? 1 : 0);
}

function computeNbOfDaysLeft(dueTimestamp: number, now: number) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return Math.floor((dueTimestamp - now) / ONE_DAY_MS);
}

function compareNbOfDaysLeft(firstNbOfDaysLeft: number, secondNbOfDaysLeft: number) {
  if (firstNbOfDaysLeft === secondNbOfDaysLeft) return 0;
  return firstNbOfDaysLeft < secondNbOfDaysLeft ? -1 : 1;
}

function computeScore(template: TaskTemplateDTO, dueTimestamp: number, now: number) {
  const PRIORITY_WEIGHT: Record<TaskTemplateDTO["priority"], number> = { low: 0.5, medium: 1, high: 2 };
  const urgency = computeUrgency(dueTimestamp, now);
  return (PRIORITY_WEIGHT[template.priority] * urgency) / Math.sqrt(Math.max(template.estimatedMn, 1));
}

function computeUrgency(dueTimestamp: number, now: number) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_URGENCY_BOOST = 2;
  const URGENCY_HALF_LIFE_MS = ONE_DAY_MS;
  const LATENESS_URGENCY_GROWTH = 0.5;
  const timeLeftMs = dueTimestamp - now;
  if (timeLeftMs >= 0) {
    return 1 + MAX_URGENCY_BOOST / (1 + timeLeftMs / URGENCY_HALF_LIFE_MS);
  }
  return 1 + MAX_URGENCY_BOOST + LATENESS_URGENCY_GROWTH * Math.log1p(-timeLeftMs / ONE_DAY_MS);
}

// ===============================

export function formatDurationMs(durationInMs: number) {
  const DURATION_UNITS = [
    { suffix: "y", durationMs: 365 * DAY_TO_MS },
    { suffix: "mo", durationMs: 30 * DAY_TO_MS },
    { suffix: "w", durationMs: 7 * DAY_TO_MS },
    { suffix: "d", durationMs: DAY_TO_MS },
    { suffix: "h", durationMs: HOUR_TO_MS },
    { suffix: "m", durationMs: MINUTE_TO_MS },
  ] as const;

  const sign = durationInMs < 0 ? "-" : "";
  const absoluteDurationMs = Math.abs(durationInMs);
  for (const { suffix, durationMs } of DURATION_UNITS) {
    const count = Math.floor(absoluteDurationMs / durationMs);
    if (count >= 1) return `${sign}${count}${suffix}`;
  }
  return "0m";
}
