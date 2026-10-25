import type { EditableColumnDefinition } from "@/components/blocks/EditableTableCell";

export const columnSizeByType: Partial<Record<EditableColumnDefinition<object>["type"], number>> = {
  select: 120,
  number: 100,
  date: 240,
  interval: 180,
};
