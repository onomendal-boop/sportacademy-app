import { DAY_OF_WEEK_VALUES } from './constants';

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function dateKeyFromLocalDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function addDaysToDateKey(dateKey, amount) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function getMondayDateKey(date = new Date()) {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (localDate.getDay() + 6) % 7;
  localDate.setDate(localDate.getDate() - mondayOffset);
  return dateKeyFromLocalDate(localDate);
}

export function getWeekDateKeys(weekStartKey) {
  return Array.from({ length: 7 }, (_, index) =>
    addDaysToDateKey(weekStartKey, index)
  );
}

export function dayOfWeekFromDateKey(dateKey) {
  const utcDay = parseDateKey(dateKey).getUTCDay(); // 0 Minggu, 1 Senin
  const mondayIndex = (utcDay + 6) % 7;
  return DAY_OF_WEEK_VALUES[mondayIndex];
}

export function combineDateKeyAndTime(dateKey, time) {
  return new Date(`${dateKey}T${time}:00.000Z`);
}

export function formatDateKey(dateKey, options = {}) {
  if (!dateKey) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'UTC',
    ...options,
  }).format(parseDateKey(dateKey));
}

export function formatShortDateKey(dateKey) {
  return formatDateKey(dateKey, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullDateKey(dateKey) {
  return formatDateKey(dateKey, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatWeekRange(weekStartKey) {
  if (!weekStartKey) return 'Memuat minggu...';

  const weekEndKey = addDaysToDateKey(weekStartKey, 6);
  const startYear = weekStartKey.slice(0, 4);
  const endYear = weekEndKey.slice(0, 4);

  return `${formatShortDateKey(weekStartKey)} - ${formatShortDateKey(weekEndKey)} ${
    startYear === endYear ? endYear : `${startYear}/${endYear}`
  }`;
}

export function timeToMinutes(time) {
  const [hours, minutes] = String(time ?? '')
    .split(':')
    .map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function timesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  const firstStartMinutes = timeToMinutes(firstStart);
  const firstEndMinutes = timeToMinutes(firstEnd);
  const secondStartMinutes = timeToMinutes(secondStart);
  const secondEndMinutes = timeToMinutes(secondEnd);

  if (
    [firstStartMinutes, firstEndMinutes, secondStartMinutes, secondEndMinutes].some(
      (value) => value === null
    )
  ) {
    return false;
  }

  return firstStartMinutes < secondEndMinutes && secondStartMinutes < firstEndMinutes;
}

export function isDateWithinRange(dateKey, startDateKey, endDateKey) {
  if (startDateKey && dateKey < startDateKey) return false;
  if (endDateKey && dateKey > endDateKey) return false;
  return true;
}
