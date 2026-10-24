import { Dialog, DialogContent, DialogFooter } from "../base/dialog";
import { taskPriorityEnumSchema, taskTemplateSchema, type TaskOccurrenceDTO, type TaskTemplateDTO } from "@repo/dtos";
import { useEffect, useState } from "react";
import { Button } from "../base/button";
import type { EditableColumnDefinition } from "./EditableTableCell";
import { EditableTableCell } from "./EditableTableCell";
import { camelCaseToSentence } from "@/lib/string.lib";

const COUNTER_TO_CONFIRM = 3;

const fieldDefinitions: (EditableColumnDefinition<TaskTemplateDTO> & {
  isFullRow?: boolean;
  shouldHideLabel?: boolean;
})[] = [
  { name: "title", type: "text", isFullRow: true, shouldHideLabel: true },
  { name: "priority", type: "select", options: taskPriorityEnumSchema.options },
  { name: "estimatedMn", type: "number" },
  { name: "firstOccurrenceStartDate", type: "date", isFullRow: true },
  { name: "overdueAfter", type: "interval" },
  { name: "nextOccurrenceEvery", type: "interval" },
  { name: "description", type: "text", isFullRow: true },
];

export function UpdateTaskModal(props: {
  taskOccurrence: TaskOccurrenceDTO;
  isOpened: boolean;
  isLoading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (taskTemplate: TaskTemplateDTO) => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const { onComplete, onDelete } = props;
  const [updatedTaskTemplate, setUpdatedTaskTemplate] = useState(props.taskOccurrence.template);
  const [deleteCounter, setDeleteCounter] = useState(0);
  const [completeCounter, setCompleteCounter] = useState(0);

  useEffect(() => {
    if (completeCounter === COUNTER_TO_CONFIRM) {
      onComplete();
    }
  }, [completeCounter, onComplete]);

  useEffect(() => {
    if (deleteCounter === COUNTER_TO_CONFIRM) {
      onDelete();
    }
  }, [deleteCounter, onDelete]);

  return (
    <Dialog open={props.isOpened} onOpenChange={() => props.onClose()}>
      <DialogContent showCloseButton={false}>
        <div className="grid grid-cols-2 gap-4">
          {fieldDefinitions.map((definition) => (
            <div key={definition.name} className={definition.isFullRow ? "col-span-2" : ""}>
              {!definition.shouldHideLabel && <div className="mb-1">{camelCaseToSentence(definition.name)}:</div>}
              <EditableTableCell
                definition={definition}
                row={updatedTaskTemplate}
                isNullable={taskTemplateSchema.shape[definition.name].safeParse(null).success}
                isChanged={updatedTaskTemplate[definition.name] !== props.taskOccurrence.template[definition.name]}
                onChange={(changes) => setUpdatedTaskTemplate((p) => ({ ...p, ...changes }))}
              />
            </div>
          ))}
        </div>

        {props.error && (
          <p role="alert" className="text-sm text-destructive">
            {props.error}
          </p>
        )}
        <DialogFooter className="flex flex-row justify-between">
          <Button
            disabled={props.isLoading}
            size="lg"
            variant="destructive"
            onClick={() => setDeleteCounter((p) => p + 1)}
          >
            {props.isLoading ? "Deleting…" : "Delete"} {deleteCounter > 0 && `+${deleteCounter}`}
          </Button>

          <div className="flex gap-4">
            <Button disabled={props.isLoading} size="lg" onClick={() => props.onSave(updatedTaskTemplate)}>
              {props.isLoading ? "Saving…" : "Save"}
            </Button>
            <Button
              className="bg-green-800 text-white"
              size="lg"
              disabled={props.isLoading}
              onClick={() => setCompleteCounter((p) => p + 1)}
            >
              {props.isLoading ? "Completing" : "Complete"} {completeCounter > 0 && `+${completeCounter}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
