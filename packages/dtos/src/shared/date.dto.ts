import { INTERVAL_UNITS, type LocalISO, type TimeInterval } from "@repo/lib";
import z from "zod";

export const IntervalUnitSchema = z.enum(INTERVAL_UNITS);

export const TimeIntervalSchema = z.object({
  count: z.number().int().positive(),
  unit: IntervalUnitSchema,
}) satisfies z.ZodType<TimeInterval>;

export const LocalISOSchema = z.iso
  .datetime({ local: true })
  .refine((v) => !v.endsWith("Z"), "Expected a date-time without offset") as z.ZodType<LocalISO, string>;
