import { getCurrentTimestamp, getPreviousDate, objectEntries, toTimestamp } from "@repo/lib";
import { GlobalConsumer } from "../../config/store";
import { TaskOccurrenceList } from "../blocks/TaskOccurrenceList";
import type { TaskOccurrenceDTO, TaskTemplateDTO } from "@repo/dtos";
import { useState } from "react";
import { FILTERS, type FiltersState } from "@/config/filters";
import { TaskOccurrenceListHeader } from "../blocks/TaskOccurrenceListHeader";

export function TaskOccurrenceListContainer() {
  const from = getPreviousDate(60, "00:00:00");
  const to = getPreviousDate(0, "23:59:59");
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [filters, setFilters] = useState(
    objectEntries(FILTERS).reduce(
      (
        acc: FiltersState,

        [filterName],
      ) => ({ ...acc, [filterName]: false }),
      {} as FiltersState,
    ),
  );

  function filterTaskOccurrences(taskOccurrences: TaskOccurrenceDTO[]) {
    return taskOccurrences.filter((taskOccurrence) => {
      if (taskOccurrence.status === "cancelled" || taskOccurrence.status === "done") {
        return false;
      }

      for (const [filterName, isFilterActive] of objectEntries(filters)) {
        if (isFilterActive && !FILTERS[filterName].filterFn(taskOccurrence)) {
          return false;
        }
      }

      return true;
    });
  }

  return (
    <GlobalConsumer
      getters={["taskOccurrences"]}
      queries={[{ name: "searchTaskOccurrences", args: [{ from, to, timeZone }] }]}
    >
      {({ taskOccurrences }) => {
        const processedTaskOccurrences = autoSortTaskOccurrences(
          filterTaskOccurrences(taskOccurrences),
          getCurrentTimestamp(),
          timeZone,
        );

        return (
          <div className="flex flex-col gap-2">
            <TaskOccurrenceListHeader
              nbOfTaskOccurrences={processedTaskOccurrences.length}
              filters={filters}
              onFilterChange={(filterName, filterValue) => setFilters((p) => ({ ...p, [filterName]: filterValue }))}
            />
            <TaskOccurrenceList taskOccurrences={processedTaskOccurrences} />
          </div>
        );
      }}
    </GlobalConsumer>
  );
}

function autoSortTaskOccurrences(taskOccurrences: TaskOccurrenceDTO[], now: number, timeZone: string) {
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
    .map(({ taskOccurrence }) => taskOccurrence);
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
