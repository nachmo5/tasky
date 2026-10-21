import { AddTaskContainer } from "../containers/AddTaskContainer";
import { TaskOccurrenceListContainer } from "../containers/TaskOccurrenceListContainer";

export function HomePage() {
  return (
    <div className="m-auto flex min-h-dvh max-w-2xl flex-col p-4">
      <TaskOccurrenceListContainer />
      <AddTaskContainer />
    </div>
  );
}
