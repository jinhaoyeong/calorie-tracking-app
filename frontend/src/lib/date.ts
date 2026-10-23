/** Dates are handled as local calendar days (YYYY-MM-DD) so meals land on the day they were eaten. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isDateKey(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateKey(fromDateKey(value)) === value;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Monday of the week containing the date. */
export function startOfWeek(key: string): string {
  const offset = (fromDateKey(key).getDay() + 6) % 7;
  return addDays(key, -offset);
}

export function weekDays(key: string): string[] {
  const monday = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const LOCALE = 'en-MY';

/** Everyday Malay greeting for the time of day. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Selamat pagi';
  if (hour >= 12 && hour < 15) return 'Selamat tengah hari';
  if (hour >= 15 && hour < 19) return 'Selamat petang';
  return 'Selamat malam';
}

export function formatDayTitle(key: string, today: string = todayKey()): string {
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  return fromDateKey(key).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatLongDate(key: string): string {
  return fromDateKey(key).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatShortWeekday(key: string): string {
  return fromDateKey(key).toLocaleDateString(LOCALE, { weekday: 'short' });
}

export function formatDayMonth(key: string): string {
  return fromDateKey(key).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

export function formatWeekRange(monday: string): string {
  return `${formatDayMonth(monday)} – ${formatDayMonth(addDays(monday, 6))}`;
}
