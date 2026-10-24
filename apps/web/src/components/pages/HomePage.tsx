import { AddTaskContainer } from "../containers/AddTaskContainer";
import { TaskOccurrenceListContainer } from "../containers/TaskOccurrenceListContainer";
import { UpdateTaskModalContainer } from "../containers/UpdateTaskModalContainer";

export function HomePage() {
  return (
    <div className="m-auto flex min-h-dvh max-w-2xl flex-col p-4">
      <TaskOccurrenceListContainer />
      <AddTaskContainer />
      <UpdateTaskModalContainer />
    </div>
  );
}
