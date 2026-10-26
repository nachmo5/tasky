import { getCurrentTimestamp, getPreviousDate, objectEntries } from "@repo/lib";
import { GlobalConsumer, type TaskOccurrence } from "../../config/store";
import { TaskOccurrenceList, type TaskOccurrenceListProps } from "../blocks/TaskOccurrenceList";
import { useState } from "react";
import { FILTERS, type FiltersState } from "@/config/filters";
import { TaskOccurrenceListHeader } from "../blocks/TaskOccurrenceListHeader";
import { autoSortTaskOccurrences, checkIsTaskOccurrenceOverdue } from "@/lib/taskOccurrence.lib";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../base/collapsible";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { Badge } from "../base/badge";

export function TaskOccurrenceListContainer() {
  const from = getPreviousDate(60, "00:00:00");
  const to = getPreviousDate(0, "23:59:59");
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [filters, setFilters] = useState(
    objectEntries(FILTERS).reduce(
      (
        acc: FiltersState,

        [filterName, opts],
      ) => ({ ...acc, [filterName]: opts.defaultValue }),
      {} as FiltersState,
    ),
  );

  return (
    <div className="flex flex-col gap-2">
      <TaskOccurrenceListHeader
        filters={filters}
        onFilterChange={(filterName, filterValue) => setFilters((p) => ({ ...p, [filterName]: filterValue }))}
      />

      <GlobalConsumer
        getters={["taskOccurrences"]}
        queries={[{ name: "searchTaskOccurrences", args: [{ from, to, timeZone }] }]}
      >
        {({ taskOccurrences, setUpdatingTaskOccurrenceId }) => {
          const processedTaskOccurrences = autoSortTaskOccurrences(
            filterTaskOccurrences(taskOccurrences, filters),
            getCurrentTimestamp(),
            timeZone,
          );

          const pendingOccurrences: TaskOccurrence[] = [];
          const completedOccurrences: TaskOccurrence[] = [];
          const pinnedOccurrences: TaskOccurrence[] = [];
          const overdueOccurrences: TaskOccurrence[] = [];

          for (const occ of processedTaskOccurrences) {
            if (occ.status !== "pending") {
              completedOccurrences.push(occ);
            } else if (occ.template.pinnedAt) {
              pinnedOccurrences.push(occ);
            } else if (checkIsTaskOccurrenceOverdue(occ)) {
              overdueOccurrences.push(occ);
            } else {
              pendingOccurrences.push(occ);
            }
          }

          return (
            <>
              <TaskOccurrenceListGroup
                groupName="Pinned"
                taskOccurrences={pinnedOccurrences.sort((ta, tb) =>
                  ta.template.pinnedAt! > tb.template.pinnedAt! ? -1 : 1,
                )}
                onClick={setUpdatingTaskOccurrenceId}
              />
              <TaskOccurrenceListGroup
                groupName="Overdue"
                taskOccurrences={overdueOccurrences}
                onClick={setUpdatingTaskOccurrenceId}
              />
              <TaskOccurrenceListGroup
                groupName="Pending"
                taskOccurrences={pendingOccurrences}
                onClick={setUpdatingTaskOccurrenceId}
              />
              <TaskOccurrenceListGroup
                groupName="Completed"
                taskOccurrences={completedOccurrences}
                onClick={setUpdatingTaskOccurrenceId}
                defaultIsNotCollapsed={false}
              />
            </>
          );
        }}
      </GlobalConsumer>
    </div>
  );
}

function TaskOccurrenceListGroup(props: {
  groupName: string;
  taskOccurrences: TaskOccurrence[];
  defaultIsNotCollapsed?: boolean;
  onClick: TaskOccurrenceListProps["onClick"];
}) {
  const [isNotCollapsed, setIsNotCollapsed] = useState(props.defaultIsNotCollapsed ?? true);
  if (props.taskOccurrences.length === 0) {
    return null;
  }
  return (
    <Collapsible open={isNotCollapsed} onOpenChange={setIsNotCollapsed}>
      <CollapsibleTrigger className="flex items-center justify-between w-full my-2">
        <span className="flex gap-2 items-center">
          <p>{props.groupName}:</p> <Badge>{props.taskOccurrences.length}</Badge>
        </span>
        {isNotCollapsed ? <ChevronDown /> : <ChevronLeft />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <TaskOccurrenceList items={props.taskOccurrences} onClick={props.onClick} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function filterTaskOccurrences(taskOccurrences: TaskOccurrence[], filters: FiltersState) {
  return taskOccurrences.filter((taskOccurrence) => {
    // if (taskOccurrence.status === "cancelled" || taskOccurrence.status === "done") {
    //   return false;
    // }

    for (const [filterName, isFilterActive] of objectEntries(filters)) {
      if (isFilterActive && !FILTERS[filterName].filterFn(taskOccurrence)) {
        return false;
      }
    }

    return true;
  });
}
