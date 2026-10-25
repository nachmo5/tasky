import { cn } from "cn";
import { INTERVAL_UNITS, toLocalISOString, type LocalISO, type TimeInterval } from "@repo/lib";
import { Input } from "../base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base/select";
import { DebouncedInput } from "./DebouncedInput";
import { camelCaseToSentence } from "@/lib/string.lib";

type FieldsOfType<TRow, TValue> = {
  [K in keyof TRow]-?: TRow[K] extends TValue ? K : never;
}[keyof TRow];

export type EditableColumnDefinition<TRow> =
  | { name: FieldsOfType<TRow, string | null>; type: "text" }
  | { name: FieldsOfType<TRow, number>; type: "number" }
  | { name: FieldsOfType<TRow, LocalISO>; type: "date" }
  | { name: FieldsOfType<TRow, string>; type: "select"; options: readonly string[] }
  | { name: FieldsOfType<TRow, TimeInterval | null>; type: "interval" };

export function EditableTableCell<TRow>({
  definition,
  row,
  isNullable = false,
  isChanged = false,
  onChange,
}: {
  definition: EditableColumnDefinition<TRow>;
  row: TRow;
  isNullable?: boolean;
  isChanged?: boolean;
  onChange: (changes: Partial<TRow>) => void;
}) {
  const changedClassName = isChanged ? "border-amber-500 dark:border-amber-500" : undefined;
  const change = (value: unknown) => onChange({ [definition.name]: value } as Partial<TRow>);

  switch (definition.type) {
    case "text": {
      return (
        <DebouncedInput
          className={changedClassName}
          value={row[definition.name] as string | null}
          formatValue={(value) => value ?? ""}
          parseValue={(text) => (text === "" && isNullable ? null : text)}
          onChange={change}
        />
      );
    }
    case "number": {
      return (
        <DebouncedInput
          className={changedClassName}
          type="number"
          value={row[definition.name] as number}
          formatValue={String}
          parseValue={parseNumber}
          onChange={change}
        />
      );
    }
    case "date": {
      const value = row[definition.name] as LocalISO;
      return (
        <Input
          key={value}
          className={changedClassName}
          type="datetime-local"
          step={1}
          defaultValue={value}
          onBlur={(e) => {
            if (!e.target.value) return;
            const next = toLocalISOString(e.target.value);
            if (next !== value) change(next);
          }}
        />
      );
    }
    case "select": {
      const value = row[definition.name] as string;
      return (
        <Select
          items={definition.options.map((option) => ({ label: option, value: option }))}
          value={value}
          onValueChange={(next) => {
            if (next !== null && next !== value) change(next);
          }}
        >
          <SelectTrigger className={cn("w-full", changedClassName)}>
            <SelectValue>{camelCaseToSentence(value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {definition.options.map((option) => (
              <SelectItem key={option} value={option}>
                {camelCaseToSentence(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "interval": {
      const value = row[definition.name] as TimeInterval | null;
      const unitItems = [
        ...(isNullable ? [{ label: "none", value: null }] : []),
        ...INTERVAL_UNITS.map((unit) => ({ label: unit, value: unit })),
      ];
      return (
        <div className="flex gap-1">
          <DebouncedInput
            type="number"
            min={1}
            step={1}
            className={cn("w-16 shrink-0", changedClassName)}
            disabled={!value}
            value={value?.count ?? null}
            formatValue={(count) => (count === null ? "" : String(count))}
            parseValue={parseIntervalCount}
            onChange={(count) => {
              if (value && count !== null) change({ ...value, count });
            }}
          />
          <Select
            items={unitItems}
            value={value?.unit ?? null}
            onValueChange={(unit) => {
              if (unit !== (value?.unit ?? null)) change(unit ? { count: value?.count ?? 1, unit } : null);
            }}
          >
            <SelectTrigger className={cn("w-full min-w-0", changedClassName)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitItems.map((item) => (
                <SelectItem key={item.label} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
  }
}

function parseNumber(text: string): number | undefined {
  const number = Number(text);
  return text === "" || Number.isNaN(number) ? undefined : number;
}

function parseIntervalCount(text: string): number | null | undefined {
  const count = Number(text);
  return text !== "" && Number.isInteger(count) && count > 0 ? count : undefined;
}
