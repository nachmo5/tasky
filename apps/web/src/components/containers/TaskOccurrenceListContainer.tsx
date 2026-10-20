import { toLocalISOString } from "@repo/lib";
import { GlobalConsumer } from "../../config/store";
import { TaskOccurrenceList } from "../blocks/TaskOccurrenceList";

export function TaskOccurrenceListContainer() {
  const now = new Date();
  const from = toLocalISOString(`${getTodayDate(now)}T00:00:00`);
  const to = toLocalISOString(`${getTodayDate(now)}T23:59:59`);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <GlobalConsumer
      getters={["taskOccurrences"]}
      queries={[{ name: "searchTaskOccurrences", args: [{ from, to, timeZone }] }]}
    >
      {({ taskOccurrences }) => <TaskOccurrenceList taskOccurrences={taskOccurrences} />}
    </GlobalConsumer>
  );
}

function getTodayDate(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
