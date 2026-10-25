import { Temporal } from "@js-temporal/polyfill";

export const INTERVAL_UNITS = ["minutes", "days", "months", "years"] as const;
export type TimeInterval = { count: number; unit: (typeof INTERVAL_UNITS)[number] };
export type LocalISO = `${number}-${number}-${number}T${number}:${number}:${number}`;

export const MINUTE_TO_MS = 60 * 1000;
export const HOUR_TO_MS = 60 * MINUTE_TO_MS;
export const DAY_TO_MS = 24 * HOUR_TO_MS;

export const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function addInterval(localDate: LocalISO, interval: TimeInterval, timeZone: string): LocalISO {
  return toRealDate(localDate, timeZone)
    .add({ [interval.unit]: interval.count })
    .toPlainDateTime()
    .toString() as LocalISO;
}

export function differenceBetweenDates(
  laterDate: LocalISO,
  earlierDate: LocalISO,
  unit: TimeInterval["unit"],
  timeZone: string,
): number {
  return toRealDate(earlierDate, timeZone).until(toRealDate(laterDate, timeZone), { largestUnit: unit })[unit];
}

export function getCurrentTimestamp() {
  return Temporal.Now.instant().epochMilliseconds;
}

// True for any time zone Temporal accepts: IANA names ("Europe/Paris", "Etc/GMT+5"), "UTC", offsets ("+01:00")
export function isValidTimeZone(timeZone: string): boolean {
  try {
    Temporal.Now.zonedDateTimeISO(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function toTimestamp(date: LocalISO, timeZone: string) {
  return toRealDate(date, timeZone).toInstant().epochMilliseconds;
}

function toRealDate(date: LocalISO, timeZone: string) {
  return Temporal.PlainDateTime.from(date).toZonedDateTime(timeZone);
}

export function toLocalISOString(v: string): LocalISO {
  return Temporal.PlainDateTime.from(v).round({ smallestUnit: "second", roundingMode: "trunc" }).toString() as LocalISO;
}

export function getPreviousDate(days: number, time?: string): LocalISO {
  if (time && time.split(":").length !== 3) {
    throw new Error("Invalid time given to getPreviousDate");
  }
  const result = Temporal.Now.plainDateISO().subtract({ days });
  return `${result.toString()}T${time ?? "00:00:00"}` as LocalISO;
}

export function getMonthGridCalendarDates(year: number, month: number): LocalISO[] {
  const firstDayOfMonth = Temporal.PlainDate.from({ year, month, day: 1 });
  const MONDAY = 1;
  // start calendar on a monday, even if previous month
  const offset = (firstDayOfMonth.dayOfWeek - MONDAY + 7) % 7;
  const firstDateOfCalendar = firstDayOfMonth.subtract({ days: offset });

  // Generate full weeks covering the month (4 to 6 rows)
  const nbOfRows = Math.ceil((offset + firstDayOfMonth.daysInMonth) / 7);
  const days: LocalISO[] = [];
  for (let i = 0; i < nbOfRows * 7; i++) {
    days.push(toLocalISOString(firstDateOfCalendar.add({ days: i }).toString()));
  }
  return days;
}

export function getNbOfDaysInMonth(year: number, month: number) {
  return Temporal.PlainDate.from({ year, month, day: 1 }).daysInMonth;
}
