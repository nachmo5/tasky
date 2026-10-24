import { useGlobalGetters, useGlobalMutations, useGlobalSetters } from "@/config/store";
import { UpdateTaskModal } from "../blocks/UpdateTaskModal";
import { toast } from "../base/toast";
import { useCallback } from "react";

export function UpdateTaskModalContainer() {
  const { taskOccurrences, updatingTaskOccurrenceId } = useGlobalGetters([
    "updatingTaskOccurrenceId",
    "taskOccurrences",
  ]);
  const { updateTaskTemplates, completeTask, deleteTaskTemplate } = useGlobalMutations([
    "updateTaskTemplates",
    "deleteTaskTemplate",
    "completeTask",
  ]);
  const { setUpdatingTaskOccurrenceId } = useGlobalSetters();

  const taskOccurrence = taskOccurrences.find((taskOccurrence) => taskOccurrence.id === updatingTaskOccurrenceId);

  const onComplete = useCallback(() => {
    void completeTask({ startDate: taskOccurrence!.startDate, taskTemplateId: taskOccurrence!.template.id }).then(() =>
      setUpdatingTaskOccurrenceId(null),
    );
    // eslint-disable-next-line
  }, [taskOccurrence?.id]);
  const onDelete = useCallback(() => {
    void deleteTaskTemplate({ id: taskOccurrence!.template.id }).then(() => setUpdatingTaskOccurrenceId(null));
    // eslint-disable-next-line
  }, [taskOccurrence?.id]);

  if (!taskOccurrence) {
    return null;
  }

  return (
    <UpdateTaskModal
      taskOccurrence={taskOccurrence}
      isOpened={!!taskOccurrence}
      isLoading={(updateTaskTemplates.status + completeTask.status + deleteTaskTemplate.status).includes("loading")}
      error={updateTaskTemplates.error?.message || ""}
      onClose={() => setUpdatingTaskOccurrenceId(null)}
      onSave={(updatedTaskTemplate) => {
        const { id, ...changes } = updatedTaskTemplate;
        void updateTaskTemplates({
          updates: [{ id, changes }],
        }).then(() => {
          toast.add({
            title: "Task saved",
          });
        });
      }}
      onComplete={onComplete}
      onDelete={onDelete}
    />
  );
}
