import { useGlobalGetters, useGlobalQueries } from "@/config/store";
import { AddTaskContainer } from "../containers/AddTaskContainer";
import { TaskOccurrenceListContainer } from "../containers/TaskOccurrenceListContainer";
import { UpdateTaskModalContainer } from "../containers/UpdateTaskModalContainer";
import { useEffect } from "react";
import { LOCAL_STORAGE_KEYS } from "@/config/localStorage";

export function HomePage() {
  return (
    <div className="m-auto flex min-h-dvh max-w-2xl flex-col p-4">
      <TaskOccurrenceListContainer />
      <AddTaskContainer />
      <UpdateTaskModalContainer />
      <BackupContainer />
    </div>
  );
}

function BackupContainer() {
  const { searchTaskTemplates } = useGlobalQueries(["searchTaskTemplates"]);
  const { taskTemplates } = useGlobalGetters(["taskTemplates"]);

  const key = taskTemplates.map((tt) => tt.id).join(",");

  useEffect(() => {
    if (searchTaskTemplates.status === "success" && taskTemplates.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS["BACKUP"],
        JSON.stringify({
          version: new Date().toLocaleString(),
          data: taskTemplates,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTaskTemplates.status, key]);

  return <></>;
}
