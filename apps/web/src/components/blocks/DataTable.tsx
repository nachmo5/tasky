import { useState } from "react";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../base/table";
import {
  // columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  // createFilteredRowModel,
  // createPaginatedRowModel,
  createSortedRowModel,
  // filterFn_includesString,
  // rowPaginationFeature,
  // rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type Row,
  type RowData,
  type SortingState,
  type TableFeatures,
  type TableMeta,
} from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<in out TFeatures extends TableFeatures, in out TData extends RowData> {
    onRowChange?: (rowId: Row<TFeatures, TData>["id"], changes: Partial<TData>) => void;
    getRowChanges?: (rowId: Row<TFeatures, TData>["id"]) => Partial<TData> | undefined;
  }
}

const features = tableFeatures({
  // columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  // rowPaginationFeature,
  // rowSelectionFeature,
  // filteredRowModel: createFilteredRowModel(),
  // filterFns: { includesString: filterFn_includesString },
  // paginatedRowModel: createPaginatedRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

export type DataTableFeatures = typeof features;

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  meta?: TableMeta<DataTableFeatures, TData>;
}

export function DataTable<TData extends RowData>({ columns, data, meta }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useTable({
    features,
    data,
    columns,
    meta,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    // Only columns that declare a `size` get a fixed width; the others share the remaining space
                    style={header.column.columnDef.size ? { width: header.getSize() } : undefined}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
