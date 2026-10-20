import {
  taskPriorityEnumSchema,
  taskTemplateSchema,
  type TaskTemplateChangesDTO,
  type TaskTemplateDTO,
} from "@repo/dtos";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable, type DataTableFeatures } from "./DataTable";
import { EditableTableCell, type EditableColumnDefinition } from "./EditableTableCell";
import { camelCaseToSentence } from "@/lib/string.lib";
import { columnSizeByType } from "@/config/table";

const columnDefinitions: EditableColumnDefinition<TaskTemplateDTO>[] = [
  { name: "title", type: "text" },
  { name: "priority", type: "select", options: taskPriorityEnumSchema.options },
  { name: "estimatedMn", type: "number" },
  { name: "firstOccurrenceStartDate", type: "date" },
  { name: "nextOccurrenceEvery", type: "interval" },
  { name: "overdueAfter", type: "interval" },
  { name: "description", type: "text" },
];

const columnHelper = createColumnHelper<DataTableFeatures, TaskTemplateDTO>();

const columns = columnHelper.columns(
  columnDefinitions.map((definition) =>
    columnHelper.accessor(definition.name, {
      // headers wrap so a long title cannot widen a fixed-width column
      header: () => <span className="whitespace-normal">{camelCaseToSentence(definition.name)}</span>,
      cell: ({ row, table }) => (
        <EditableTableCell
          definition={definition}
          row={row.original}
          isNullable={taskTemplateSchema.shape[definition.name].safeParse(null).success}
          isChanged={definition.name in (table.options.meta?.getRowChanges?.(row.original.id) ?? {})}
          onChange={(changes) => table.options.meta?.onRowChange?.(row.original.id, changes)}
        />
      ),
      size: columnSizeByType[definition.type],
    }),
  ),
);

export function TaskTemplateTable(props: {
  taskTemplates: TaskTemplateDTO[];
  changesById: Record<string, TaskTemplateChangesDTO>;
  onChange: (taskTemplateId: string, changes: TaskTemplateChangesDTO) => void;
}) {
  return (
    <DataTable
      columns={columns}
      data={props.taskTemplates}
      meta={{ onRowChange: props.onChange, getRowChanges: (rowId) => props.changesById[rowId] }}
    />
  );
}
