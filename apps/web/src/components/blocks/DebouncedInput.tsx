import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { Input } from "../base/input";

const INPUT_DEBOUNCE_MS = 100;

export function DebouncedInput<TValue>({
  value,
  formatValue,
  parseValue,
  onChange,
  onBlur,
  ...inputProps
}: Omit<ComponentProps<typeof Input>, "value" | "defaultValue" | "onChange"> & {
  value: TValue;
  formatValue: (value: TValue) => string;
  parseValue: (text: string) => TValue | undefined;
  onChange: (value: TValue) => void;
}) {
  const [text, setText] = useState(() => formatValue(value));
  const [syncedValue, setSyncedValue] = useState(value);
  const [reportedValue, setReportedValue] = useState<{ value: TValue } | null>(null);
  const latestPropsRef = useRef({ value, parseValue, onChange });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value !== reportedValue?.value) setText(formatValue(value));
  }

  useLayoutEffect(() => {
    latestPropsRef.current = { value, parseValue, onChange };
  });

  useEffect(() => () => clearTimeout(debounceTimerRef.current), []);

  function reportText(nextText: string) {
    clearTimeout(debounceTimerRef.current);
    const latestProps = latestPropsRef.current;
    const nextValue = latestProps.parseValue(nextText);
    if (nextValue === undefined || nextValue === latestProps.value) return;
    setReportedValue({ value: nextValue });
    latestProps.onChange(nextValue);
  }

  return (
    <Input
      {...inputProps}
      value={text}
      onChange={(e) => {
        const nextText = e.target.value;
        setText(nextText);
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => reportText(nextText), INPUT_DEBOUNCE_MS);
      }}
      onBlur={(e) => {
        reportText(text);
        if (parseValue(text) === undefined) setText(formatValue(value));
        onBlur?.(e);
      }}
    />
  );
}
