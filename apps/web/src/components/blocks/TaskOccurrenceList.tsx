import { Card } from "../base/card";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { MINUTE_TO_MS } from "@repo/lib";
import { cn } from "cn";
import { formatDurationMs, type TaskOccurrenceListItem } from "@/lib/taskOccurrence.lib";

export function TaskOccurrenceList(props: {
  items: TaskOccurrenceListItem[];
  onClick: (taskOccurrenceId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {props.items.map(({ taskOccurrence, timeToDueMs }) => (
        <Card
          onClick={() => props.onClick(taskOccurrence.id)}
          key={taskOccurrence.id}
          className={cn(
            "grid grid-cols-[1fr_max-content_max-content_max-content_max-content] items-center px-2 gap-2",
            {
              "border border-red-500/50": taskOccurrence.status === "overdue",
            },
            "text-secondary-foreground",
          )}
        >
          <p className="break-all text-primary">{taskOccurrence.template.title}</p>
          <p className="text-xs">{formatDurationMs(taskOccurrence.template.estimatedMn * MINUTE_TO_MS)}</p>
          {taskOccurrence.template.nextOccurrenceEvery ? <RefreshCw size={14} /> : <p />}
          {
            {
              low: <TrendingDown size={14} />,
              high: <TrendingUp size={14} />,
              medium: <p />,
            }[taskOccurrence.template.priority]
          }
          <p className="text-xs text-primary">{timeToDueMs === null ? "" : formatDurationMs(timeToDueMs)}</p>
        </Card>
      ))}
    </div>
  );
}
