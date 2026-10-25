import { toLocalISOString } from "@repo/lib";
import { GlobalConsumer } from "../../config/store";
import { TaskList } from "../blocks/TaskList";

export function TaskListContainer() {
  const now = new Date();
  const from = toLocalISOString(`${getTodayDate(now)}T00:00:00`);
  const to = toLocalISOString(`${getTodayDate(now)}T23:59:59`);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <GlobalConsumer getters={["tasks"]} queries={[{ name: "searchTasks", args: [{ from, to, timeZone }] }]}>
      {({ tasks }) => <TaskList tasks={tasks} />}
    </GlobalConsumer>
  );
}

function getTodayDate(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
