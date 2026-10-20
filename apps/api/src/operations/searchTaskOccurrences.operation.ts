import {
  addInterval,
  differenceBetweenDates,
  getCurrentTimestamp,
  toTimestamp,
  type LocalISO,
  type TimeInterval,
} from "@repo/lib";
import type { Providers } from "../providers/types.provider.ts";
import type { TaskOccurrence, TaskTemplate, User } from "./types.operation.ts";

export async function searchTaskOccurrences(
  args: {
    fromLocal: LocalISO;
    toLocal: LocalISO;
    timeZone: string;
  },
  user: User,
  providers: Pick<Providers, "db">,
): Promise<TaskOccurrence[]> {
  const { fromLocal, toLocal, timeZone } = args;
  const taskTemplates = await providers.db.queries.selectTaskTemplates(user.id);
  return taskTemplates
    .map((taskTemplate) => generateTaskOccurrences({ taskTemplate, fromLocal, toLocal, timeZone }))
    .flat();
}

const MAX_OCCURRENCES_PER_TASK = 50;

function generateTaskOccurrences(args: {
  taskTemplate: TaskTemplate;
  fromLocal: LocalISO;
  toLocal: LocalISO;
  timeZone: string;
}): TaskOccurrence[] {
  const { taskTemplate, fromLocal, toLocal, timeZone } = args;
  const fromLocalTimestamp = toTimestamp(fromLocal, timeZone);
  const toLocalTimestamp = toTimestamp(toLocal, timeZone);
  const now = getCurrentTimestamp();
  // One SHOT
  if (!taskTemplate.nextOccurrenceEvery) {
    return toLocalTimestamp < toTimestamp(taskTemplate.firstOccurrenceLocalStartDate, timeZone)
      ? []
      : [
          generateTaskOccurrence({
            taskTemplate,
            localStartDate: taskTemplate.firstOccurrenceLocalStartDate,
            timeZone,
            now,
          }),
        ];
  }
  let nbOfOccurrences = computeNbOfOccurrencesBefore({
    firstOccurrenceLocalStartDate: taskTemplate.firstOccurrenceLocalStartDate,
    nextOccurrenceEvery: taskTemplate.nextOccurrenceEvery,
    toLocal,
    timeZone,
  });

  const taskOccurrences: TaskOccurrence[] = [];

  while (nbOfOccurrences > 0 && taskOccurrences.length < MAX_OCCURRENCES_PER_TASK) {
    const taskOccurrence = generateTaskOccurrence({
      taskTemplate,
      timeZone,
      now,
      localStartDate: addInterval(
        taskTemplate.firstOccurrenceLocalStartDate,
        {
          unit: taskTemplate.nextOccurrenceEvery.unit,
          count: taskTemplate.nextOccurrenceEvery.count * (nbOfOccurrences - 1),
        },
        timeZone,
      ),
    });
    if (taskOccurrence.localDueDate && fromLocalTimestamp > toTimestamp(taskOccurrence.localDueDate, timeZone)) {
      break;
    }

    taskOccurrences.push(taskOccurrence);
    nbOfOccurrences -= 1;
  }

  return taskOccurrences;
}

function generateTaskOccurrence(args: {
  taskTemplate: TaskTemplate;
  localStartDate: LocalISO;
  timeZone: string;
  now: number;
}): TaskOccurrence {
  const { taskTemplate, localStartDate, timeZone, now } = args;

  const localDueDate = taskTemplate.overdueAfter
    ? addInterval(localStartDate, taskTemplate.overdueAfter, timeZone)
    : null;

  let status: TaskOccurrence["status"] = "pending";
  const completedOccurrence = taskTemplate.completedOccurrences.find((co) => co.localStartDate == localStartDate);

  if (completedOccurrence) {
    status = completedOccurrence.isCancelled ? "cancelled" : "done";
  } else if (localDueDate && now > toTimestamp(localDueDate, timeZone)) {
    status = "overdue";
  }

  return {
    id: taskTemplate.id + "_" + localStartDate,
    status,
    localStartDate,
    localDueDate,
    taskTemplate,
    completedAt: completedOccurrence?.completedAt || null,
  };
}

/* n = 1 +  (to - start_date) / interval  */
function computeNbOfOccurrencesBefore(args: {
  firstOccurrenceLocalStartDate: LocalISO;
  nextOccurrenceEvery: TimeInterval;
  toLocal: LocalISO;
  timeZone: string;
}): number {
  const { firstOccurrenceLocalStartDate, nextOccurrenceEvery, toLocal, timeZone } = args;
  const diff = differenceBetweenDates(toLocal, firstOccurrenceLocalStartDate, nextOccurrenceEvery.unit, timeZone);
  if (diff < 0) return 0;

  /* Temporal.until is not precise, it can be wrong in both direction by 1 */
  let estimatedNbOfOccurrences = 1 + Math.floor(diff / nextOccurrenceEvery.count);

  const computeOccurrenceStartDate = (occurrenceNb: number) =>
    addInterval(
      firstOccurrenceLocalStartDate,
      { unit: nextOccurrenceEvery.unit, count: nextOccurrenceEvery.count * (occurrenceNb - 1) },
      timeZone,
    );

  while (
    estimatedNbOfOccurrences > 0 &&
    toTimestamp(computeOccurrenceStartDate(estimatedNbOfOccurrences), timeZone) >= toTimestamp(toLocal, timeZone)
  ) {
    estimatedNbOfOccurrences -= 1;
  }
  while (
    toTimestamp(computeOccurrenceStartDate(estimatedNbOfOccurrences + 1), timeZone) < toTimestamp(toLocal, timeZone)
  ) {
    estimatedNbOfOccurrences += 1;
  }
  return estimatedNbOfOccurrences;
}
