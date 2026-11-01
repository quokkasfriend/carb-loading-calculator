// Calendar arithmetic on "YYYY-MM-DD" strings (whole days in UTC, so daylight saving never shifts a day)
// and on "HH:MM" times (minutes from midnight).
const MS_PER_DAY = 86_400_000;
const MIN_PER_HOUR = 60;
const MIN_PER_DAY = 1440;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

/** Whole days since 1970-01-01, or null when the string is not a real calendar date. */
export function parseDate(s: string): number | null {
  const m = DATE_RE.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return ms / MS_PER_DAY;
}

export function formatDate(days: number): string {
  const d = new Date(days * MS_PER_DAY);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function mustParseDate(s: string): number {
  const days = parseDate(s);
  if (days === null) throw new Error(`invalid date: ${s}`);
  return days;
}

/** Calendar days from `a` to `b` (positive when `b` is later). */
export const gap = (a: string, b: string): number => mustParseDate(b) - mustParseDate(a);

export const addDays = (date: string, n: number): string => formatDate(mustParseDate(date) + n);

/** Minutes from midnight, or null when the string is not HH:MM. */
export function parseTime(s: string): number | null {
  const m = TIME_RE.exec(s);
  return m ? Number(m[1]) * MIN_PER_HOUR + Number(m[2]) : null;
}

export const isValidTime = (s: string): boolean => TIME_RE.test(s);

export function formatTime(minutes: number): string {
  return `${pad(Math.floor(minutes / MIN_PER_HOUR))}:${pad(minutes % MIN_PER_HOUR)}`;
}

/** `time` minus `hours`. `dayOffset` is -1 when the result falls on the previous day (the time wraps). */
export function subtractHours(time: string, hours: number): { time: string; dayOffset: 0 | -1 } {
  const start = parseTime(time);
  if (start === null) throw new Error(`invalid time: ${time}`);
  const target = start - hours * MIN_PER_HOUR;
  return target < 0 ? { time: formatTime(target + MIN_PER_DAY), dayOffset: -1 } : { time: formatTime(target), dayOffset: 0 };
}
