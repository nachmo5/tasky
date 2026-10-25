import type { TaskTemplateChangesDTO, TaskTemplateDTO } from "@repo/dtos";
import { useState } from "react";
import { GlobalConsumer } from "@/config/store";
import { TaskTemplateTable } from "../blocks/TaskTemplateTable";
import { Button } from "../base/button";
import { getRoute } from "@/config/routes";
import { Link } from "react-router";
import { buttonVariants } from "@/lib/css.lib";

export function TaskTemplatesEditContainer() {
  const [taskTemplateChanges, setTaskTemplateChanges] = useState<Record<string, TaskTemplateChangesDTO>>({});

  return (
    <div className="flex flex-col gap-4 p-8">
      <GlobalConsumer mutations={["updateTaskTemplates"]}>
        {({ updateTaskTemplates }) => (
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
        )}
      </GlobalConsumer>

      <GlobalConsumer getters={["taskTemplates"]} queries={["searchTaskTemplates"]}>
        {({ taskTemplates }) => (
          <TaskTemplateTable
            taskTemplates={filterTaskTemplates(taskTemplates).map((taskTemplate) => ({
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
      <Link to={getRoute("/")} className={buttonVariants({ variant: "default" })}>
        {" "}
        Go Home
      </Link>
      {props.saveError && (
        <p role="alert" className="text-sm text-destructive">
          {props.saveError}
        </p>
      )}
    </div>
  );
}

function filterTaskTemplates(taskTemplates: TaskTemplateDTO[]) {
  // ignore completed one shot occurrences
  return taskTemplates.filter(
    (taskTemplate) => !!taskTemplate.nextOccurrenceEvery || taskTemplate.completedOccurrences.length === 0,
  );
}
