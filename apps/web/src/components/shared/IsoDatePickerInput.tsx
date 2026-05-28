"use client";

import { DatePickerInput, type DatePickerInputProps } from "@mantine/dates";
import { parseLocalDate, toIsoDate } from "@/lib/dates";

type Props = Omit<DatePickerInputProps<"default">, "value" | "onChange" | "type"> & {
  /** Stored calendar date as `YYYY-MM-DD` (or '' / null when empty). */
  value: string | null | undefined;
  /** Receives `YYYY-MM-DD`, or '' when cleared. */
  onChange: (iso: string) => void;
};

/**
 * Mantine `DatePickerInput` bound to an ISO `YYYY-MM-DD` string instead of a
 * `Date`. Centralizes the timezone-safe `parseLocalDate` / `toIsoDate` adapter
 * that was hand-rolled at every release-form / profile callsite — a fix to the
 * canonical helpers now reaches all of them.
 */
export default function IsoDatePickerInput({ value, onChange, ...rest }: Props) {
  return (
    <DatePickerInput
      placeholder="MM/DD/YYYY"
      {...rest}
      value={parseLocalDate(value)}
      onChange={(date) => onChange(date ? toIsoDate(date) : "")}
    />
  );
}
