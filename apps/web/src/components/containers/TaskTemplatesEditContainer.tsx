import type { TaskTemplateChangesDTO } from "@repo/dtos";
import { useState } from "react";
import { GlobalConsumer } from "@/config/store";
import { TaskTemplateTable } from "../blocks/TaskTemplateTable";
import { Button } from "../base/button";

export function TaskTemplatesEditContainer() {
  const [taskTemplateChanges, setTaskTemplateChanges] = useState<Record<string, TaskTemplateChangesDTO>>({});

  return (
    <div className="p-8">
      <GlobalConsumer getters={["taskTemplates"]} queries={["searchTaskTemplates"]} mutations={["updateTaskTemplates"]}>
        {({ taskTemplates, updateTaskTemplates }) => (
          <div className="flex flex-col gap-4">
            <TaskTemplateHeader
              nbOfChanges={Object.keys(taskTemplateChanges).length}
              isSaving={updateTaskTemplates.status === "loading"}
              saveError={updateTaskTemplates.status === "error" ? updateTaskTemplates.error?.message : undefined}
              onSave={() =>
                void updateTaskTemplates({
                  updates: Object.entries(taskTemplateChanges).map(([id, changes]) => ({ id, changes })),
                }).then(() => setTaskTemplateChanges({}))
              }
              onDiscard={() => setTaskTemplateChanges({})}
            />
            <TaskTemplateTable
              taskTemplates={taskTemplates.map((taskTemplate) => ({
                ...taskTemplate,
                ...taskTemplateChanges[taskTemplate.id],
              }))}
              changesById={taskTemplateChanges}
              onChange={(taskTemplateId, changes) =>
                setTaskTemplateChanges((current) => ({
                  ...current,
                  [taskTemplateId]: { ...current[taskTemplateId], ...changes },
                }))
              }
            />
          </div>
        )}
      </GlobalConsumer>
    </div>
  );
}

function TaskTemplateHeader(props: {
  nbOfChanges: number;
  isSaving: boolean;
  saveError?: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button disabled={props.nbOfChanges === 0 || props.isSaving} onClick={props.onSave}>
        {props.isSaving ? "Saving…" : `Save (${props.nbOfChanges})`}
      </Button>
      <Button variant="ghost" disabled={props.nbOfChanges === 0 || props.isSaving} onClick={props.onDiscard}>
        Discard
      </Button>
      {props.saveError && (
        <p role="alert" className="text-sm text-destructive">
          {props.saveError}
        </p>
      )}
    </div>
  );
}
