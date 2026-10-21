import type { TaskOccurrenceDTO } from "@repo/dtos";
import { TrendingDown, RefreshCw } from "lucide-react";

export const FILTERS = {
  shouldHideLowPriority: {
    icon: TrendingDown,
    filterFn: (taskOccurrence: TaskOccurrenceDTO) => taskOccurrence.template.priority !== "low",
  },
  shouldHideRecurrent: {
    icon: RefreshCw,
    filterFn: (taskOccurrence: TaskOccurrenceDTO) => !taskOccurrence.template.nextOccurrenceEvery,
  },
} as const satisfies Record<string, FilterDefinition>;

type FilterDefinition = {
  icon: React.FC;
  filterFn: (taskOccurrence: TaskOccurrenceDTO) => boolean;
};

export type FiltersState = {
  [K in keyof typeof FILTERS]: boolean;
};
