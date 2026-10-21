import { Card } from "../base/card";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { MINUTE_TO_MS } from "@repo/lib";
import { cn } from "cn";
import { formatDurationMs, type TaskOccurrenceListItem } from "@/lib/taskOccurrence.lib";

export function TaskOccurrenceList(props: { items: TaskOccurrenceListItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      {props.items.map(({ taskOccurrence, timeToDueMs }) => (
        <Card
          key={taskOccurrence.id}
          className={cn("grid grid-cols-[1fr_max-content_max-content_max-content_1.5rem] items-center px-2 gap-2", {
            "border border-red-500": taskOccurrence.status === "overdue",
          })}
        >
          <p className="break-all">{taskOccurrence.template.title}</p>
          {taskOccurrence.template.nextOccurrenceEvery ? <RefreshCw size={14} /> : <p />}
          <p className="text-xs text-secondary-foreground">
            {timeToDueMs === null ? "" : formatDurationMs(timeToDueMs)}
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
      ))}
    </div>
  );
}
