import { getCurrentTimestamp, getPreviousDate, objectEntries } from "@repo/lib";
import { GlobalConsumer } from "../../config/store";
import { TaskOccurrenceList } from "../blocks/TaskOccurrenceList";
import type { TaskOccurrenceDTO } from "@repo/dtos";
import { useState } from "react";
import { FILTERS, type FiltersState } from "@/config/filters";
import { TaskOccurrenceListHeader } from "../blocks/TaskOccurrenceListHeader";
import { autoSortTaskOccurrences } from "@/lib/taskOccurrence.lib";

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

  return (
    <GlobalConsumer
      getters={["taskOccurrences"]}
      queries={[{ name: "searchTaskOccurrences", args: [{ from, to, timeZone }] }]}
    >
      {({ taskOccurrences, setUpdatingTaskOccurrenceId }) => {
        const taskOccurrenceItems = autoSortTaskOccurrences(
          filterTaskOccurrences(taskOccurrences, filters),
          getCurrentTimestamp(),
          timeZone,
        );

        return (
          <div className="flex flex-col gap-2">
            <TaskOccurrenceListHeader
              nbOfTaskOccurrences={taskOccurrenceItems.length}
              filters={filters}
              onFilterChange={(filterName, filterValue) => setFilters((p) => ({ ...p, [filterName]: filterValue }))}
            />
            <TaskOccurrenceList items={taskOccurrenceItems} onClick={setUpdatingTaskOccurrenceId} />
          </div>
        );
      }}
    </GlobalConsumer>
  );
}

function filterTaskOccurrences(taskOccurrences: TaskOccurrenceDTO[], filters: FiltersState) {
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
