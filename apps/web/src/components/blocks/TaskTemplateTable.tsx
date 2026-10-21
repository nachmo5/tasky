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
import { ArrowUpDown } from "lucide-react";
import { Button } from "../base/button";

const columnDefinitions: EditableColumnDefinition<TaskTemplateDTO>[] = [
  { name: "title", type: "text" },
  { name: "priority", type: "select", options: taskPriorityEnumSchema.options },
  { name: "estimatedMn", type: "number" },
  { name: "firstOccurrenceStartDate", type: "date" },
  { name: "overdueAfter", type: "interval" },
  { name: "nextOccurrenceEvery", type: "interval" },
  { name: "description", type: "text" },
];

const columnHelper = createColumnHelper<DataTableFeatures, TaskTemplateDTO>();

const columns = columnHelper.columns(
  columnDefinitions.map((definition) =>
    columnHelper.accessor(definition.name, {
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            <span className="whitespace-normal">{camelCaseToSentence(definition.name)}</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
