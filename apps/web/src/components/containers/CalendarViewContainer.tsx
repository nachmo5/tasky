import { GlobalConsumer, type TaskOccurrence } from "@/config/store";
import { getMonthGridCalendarDates, MONTHS, WEEK_DAYS } from "@repo/lib";
import { cn } from "cn";
import { useState } from "react";
import { Button } from "../base/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { getRoute } from "@/config/routes";
import { buttonVariants } from "@/lib/css.lib";

export function CalendarViewContainer() {
  const now = new Date();
  const todaysDay = now.getDate();
  const todaysMonth = now.getMonth() + 1;
  const todaysYear = now.getFullYear();

  const [currentMonth, setCurrentMonth] = useState(todaysMonth);
  const [currentYear, setCurrentYear] = useState(todaysYear);
  const [isFiltered, setIsFiltered] = useState(true);

  const monthGridCalendarDates = getMonthGridCalendarDates(currentYear, currentMonth);
  const from = monthGridCalendarDates[0]!;
  const to = monthGridCalendarDates[monthGridCalendarDates.length - 1]!;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <GlobalConsumer
      getters={["taskOccurrences"]}
      queries={[{ name: "searchTaskOccurrences", args: [{ from, to, timeZone }] }]}
    >
      {({ taskOccurrences, setUpdatingTaskOccurrenceId }) => {
        const processedTaskOccurrences = isFiltered
          ? taskOccurrences.filter(
              (to) =>
                to.template.nextOccurrenceEvery?.unit !== "minutes" && to.template.nextOccurrenceEvery?.unit !== "days",
            )
          : taskOccurrences;
        const startDateToTaskOccurrences: Record<string, TaskOccurrence[]> = {};
        const dueDateToTaskOccurrences: Record<string, TaskOccurrence[]> = {};

        for (const taskOccurrence of processedTaskOccurrences) {
          if (taskOccurrence.status != "pending") {
            continue;
          }
          // start date
          const [startDate] = taskOccurrence.startDate.split("T") as [string];
          if (!startDateToTaskOccurrences[startDate]) {
            startDateToTaskOccurrences[startDate] = [];
          }
          startDateToTaskOccurrences[startDate].push(taskOccurrence);

          // due date
          if (!taskOccurrence.dueDate) {
            continue;
          }
          const [dueDate] = taskOccurrence.dueDate.split("T") as [string];

          if (startDateToTaskOccurrences[dueDate]?.find((to) => to.id === taskOccurrence.id)) {
            continue;
          }

          if (!dueDateToTaskOccurrences[dueDate]) {
            dueDateToTaskOccurrences[dueDate] = [];
          }
          dueDateToTaskOccurrences[dueDate].push(taskOccurrence);
        }

        return (
          <div className="p-4 h-dvh w-dvw">
            <div className="flex flex-col h-full items-center">
              <div className="flex gap-2 justify-between items-center w-full">
                <Link to={getRoute("/")} className={buttonVariants({ variant: "default" }) + ` w-20`}>
                  Home
                </Link>

                <div className="flex gap-4 items-center py-2">
                  <Button
                    onClick={() => {
                      if (currentMonth === 1) {
                        setCurrentMonth(12);
                        setCurrentYear(currentYear - 1);
                      } else {
                        setCurrentMonth(currentMonth - 1);
                      }
                    }}
                  >
                    <ChevronLeft />
                  </Button>
                  <div className="font-bold text-2xl">
                    {MONTHS[currentMonth - 1]} {currentYear}
                  </div>
                  <Button
                    onClick={() => {
                      if (currentMonth === 12) {
                        setCurrentMonth(1);
                        setCurrentYear(currentYear + 1);
                      } else {
                        setCurrentMonth(currentMonth + 1);
                      }
                    }}
                  >
                    <ChevronRight />
                  </Button>
                </div>

                <div>
                  <Button onClick={() => setIsFiltered((p) => !p)} variant={isFiltered ? "default" : "outline"}>
                    Is Filtered
                  </Button>
                </div>
              </div>
              <div className="w-full grid grid-cols-7 justify-center items-center text-center">
                {WEEK_DAYS.map((weekDay) => (
                  <p key={weekDay} className="text-secondary-foreground font-bold p-1">
                    {weekDay}
                  </p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px flex-1 bg-border border border-border w-full">
                {monthGridCalendarDates.map((monthDate) => {
                  const [date] = monthDate.split("T") as [string];
                  const [_year, month, day] = splitDate(date);
                  return (
                    <div
                      key={monthDate}
                      className={cn(
                        "text-center text-xs p-2",
                        month === todaysMonth && day === todaysDay
                          ? "bg-blue-500/30"
                          : month === currentMonth
                            ? "bg-background"
                            : "bg-border/25",
                      )}
                    >
                      <p>{day}</p>
                      <div className="flex flex-col gap-2">
                        {startDateToTaskOccurrences[date]?.map((taskOccurrence) => (
                          <Button
                            key={taskOccurrence.id}
                            variant={taskOccurrence.template.nextOccurrenceEvery ? "outline" : "default"}
                            onClick={() => setUpdatingTaskOccurrenceId(taskOccurrence.id)}
                          >
                            {taskOccurrence.template.title}
                          </Button>
                        ))}

                        {dueDateToTaskOccurrences[date]?.map((taskOccurrence) => (
                          <Button
                            key={taskOccurrence.id}
                            variant="destructive"
                            onClick={() => setUpdatingTaskOccurrenceId(taskOccurrence.id)}
                          >
                            {taskOccurrence.template.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }}
    </GlobalConsumer>
  );
}

function splitDate(date: string): [number, number, number] {
  const [year, month, day] = date.split("-");
  return [parseInt(year!), parseInt(month!), parseInt(day!)];
}
