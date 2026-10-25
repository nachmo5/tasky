import type { CreateTaskTemplateRequest } from "@repo/dtos";
import { getPreviousDate } from "@repo/lib";
import { GlobalConsumer } from "@/config/store";
import { AddTaskButton } from "../blocks/AddTaskButton";
import { AddTaskModal } from "../blocks/AddTaskModal";

export function AddTaskContainer() {
  return (
    <GlobalConsumer getters={["isAddModalOpened"]} mutations={["createTaskTemplate"]}>
      {({ isAddModalOpened, setIsAddModalOpened, createTaskTemplate }) => (
        <>
          <AddTaskButton onClick={() => setIsAddModalOpened(true)} />
          <AddTaskModal
            isOpen={isAddModalOpened}
            isSaving={createTaskTemplate.status === "loading"}
            saveError={createTaskTemplate.status === "error" ? createTaskTemplate.error?.message : undefined}
            onOpenChange={setIsAddModalOpened}
            onSave={(title) =>
              void createTaskTemplate(buildNewTaskTemplateRequest(title)).then(
                () => setIsAddModalOpened(false),
                () => {},
              )
            }
          />
        </>
      )}
    </GlobalConsumer>
  );
}

function buildNewTaskTemplateRequest(title: string): CreateTaskTemplateRequest {
  return {
    title,
    description: null,
    priority: "high",
    estimatedMn: 15,
    tags: {},
    firstOccurrenceStartDate: getPreviousDate(0, "00:00:00"),
    nextOccurrenceEvery: null,
    overdueAfter: { count: 1, unit: "days" },
    pinnedAt: null,
  };
}
