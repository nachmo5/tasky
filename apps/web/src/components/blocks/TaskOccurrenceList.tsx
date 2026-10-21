import type { TaskOccurrenceDTO } from "@repo/dtos";
import { Card } from "../base/card";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { toTimestamp, type LocalISO } from "@repo/lib";
import { cn } from "cn";

const MINUTE_TO_MS = 60 * 1000;
const HOUR_TO_MS = 60 * MINUTE_TO_MS;
const DAY_TO_MS = 24 * HOUR_TO_MS;

export function TaskOccurrenceList(props: { taskOccurrences: TaskOccurrenceDTO[] }) {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="flex flex-col gap-2">
      {props.taskOccurrences.map((taskOccurrence) => {
        const nbOfDaysToDueDate = taskOccurrence.dueDate
          ? computeDaysToDueDate(now, taskOccurrence.dueDate, timeZone)
          : null;
        return (
          <Card
            key={taskOccurrence.id}
            className={cn("grid grid-cols-[1fr_max-content_max-content_max-content_1.5rem] items-center px-2 gap-2", {
              "border border-red-500": taskOccurrence.status === "overdue",
            })}
          >
            <p className="break-all">{taskOccurrence.template.title}</p>
            {taskOccurrence.template.nextOccurrenceEvery ? <RefreshCw size={14} /> : <p />}
            <p className="text-xs text-secondary-foreground">
              {nbOfDaysToDueDate ? formatDurationMs(nbOfDaysToDueDate) : ""}
            </p>
            {
              {
                low: <TrendingDown size={14} className="text-blue-500" />,
                high: <TrendingUp size={14} className="text-orange-500" />,
                medium: <p />,
              }[taskOccurrence.template.priority]
            }
            <p className="text-xs">{formatDurationMs(taskOccurrence.template.estimatedMn * MINUTE_TO_MS)}</p>
          </Card>
        );
      })}
    </div>
  );
}

function computeDaysToDueDate(now: Date, dueDate: LocalISO, timeZone: string): number {
  return toTimestamp(dueDate, timeZone) - now.getTime();
}

function formatDurationMs(durationInMs: number) {
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
