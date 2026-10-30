const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// 今日を基準に、日本時間で dayOffset 日後の hour 時 minute 分を返す
export function jstDate(dayOffset: number, hour = 0, minute = 0): Date {
  const now = new Date(Date.now() + JST_OFFSET_MS);
  const base = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + dayOffset,
    hour,
    minute,
  );
  return new Date(base - JST_OFFSET_MS);
}

// 今日以降で最初に来る曜日（0 が日曜）の hour 時 minute 分を返す
export function nextWeekday(weekday: number, hour = 0, minute = 0): Date {
  const today = new Date(Date.now() + JST_OFFSET_MS).getUTCDay();
  return jstDate((weekday - today + 7) % 7, hour, minute);
}

export function startOfJstDay(date: Date = new Date()): Date {
  const j = new Date(date.getTime() + JST_OFFSET_MS);
  return new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST_OFFSET_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

// 今日が含まれる週末（土曜 0 時から月曜 0 時の手前まで）。今日が日曜なら今日から
export function thisWeekendRange(): [Date, Date] {
  const today = startOfJstDay();
  const dow = new Date(today.getTime() + JST_OFFSET_MS).getUTCDay();
  const toSat = dow === 0 ? -1 : 6 - dow;
  const start = addDays(today, toSat);
  return [start, addDays(start, 2)];
}
