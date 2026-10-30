import { startOfJstDay } from './dates';

const TZ = 'Asia/Tokyo';

const partsFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: TZ,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface DateParts {
  year: string;
  month: string;
  day: string;
  weekday: string;
  hour: string;
  minute: string;
}

function parts(date: Date): DateParts {
  const out: Record<string, string> = {};
  for (const p of partsFormatter.formatToParts(date)) out[p.type] = p.value;
  return out as unknown as DateParts;
}

export function formatDate(date: Date): string {
  const p = parts(date);
  return `${p.year}/${p.month.padStart(2, '0')}/${p.day.padStart(2, '0')}`;
}

// 「2026年10月30日(金)」
export function formatLongDate(date: Date): string {
  const p = parts(date);
  return `${p.year}年${p.month}月${p.day}日(${p.weekday})`;
}

export function formatMonthDay(date: Date): string {
  const p = parts(date);
  return `${p.month}/${p.day}`;
}

export function formatMonthDayWeekday(date: Date): string {
  const p = parts(date);
  return `${p.month}/${p.day}(${p.weekday})`;
}

export function formatTime(date: Date): string {
  const p = parts(date);
  return `${p.hour}:${p.minute}`;
}

export function formatMonthLabel(date: Date): string {
  const p = parts(date);
  return `${p.year}年${p.month}月`;
}

export function weekday(date: Date): string {
  return parts(date).weekday;
}

export function dayOfMonth(date: Date): string {
  return parts(date).day;
}

export function monthOf(date: Date): string {
  return parts(date).month;
}

export function sameJstDay(a: Date, b: Date): boolean {
  return startOfJstDay(a).getTime() === startOfJstDay(b).getTime();
}

// 「今日」「明日」「3 日後」など
export function relativeDay(date: Date, now: Date = new Date()): string {
  const diff = Math.round(
    (startOfJstDay(date).getTime() - startOfJstDay(now).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff === 0) return '今日';
  if (diff === 1) return '明日';
  if (diff === -1) return '昨日';
  if (diff > 1) return `${diff} 日後`;
  return `${-diff} 日前`;
}

// 「10/31(土) 10:00〜16:00」「11/01(日)〜11/03(火)」のような開催日時の表記
export function formatWhen(startsAt: Date, endsAt: Date | null, allDay: boolean): string {
  const start = formatMonthDayWeekday(startsAt);
  if (!endsAt) return allDay ? start : `${start} ${formatTime(startsAt)}〜`;
  if (sameJstDay(startsAt, endsAt)) {
    return allDay ? start : `${start} ${formatTime(startsAt)}〜${formatTime(endsAt)}`;
  }
  return `${start}〜${formatMonthDayWeekday(endsAt)}`;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// 「3 時間前」「2 日前」のような更新の目安
export function timeAgo(date: Date, now: Date = new Date()): string {
  const min = Math.round((now.getTime() - date.getTime()) / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min} 分前`;
  const hour = Math.round(min / 60);
  if (hour < 24) return `${hour} 時間前`;
  return `${Math.round(hour / 24)} 日前`;
}
