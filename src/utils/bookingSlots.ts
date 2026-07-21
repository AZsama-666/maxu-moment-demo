import type { MomentItem } from '../data/mock';

export const DEFAULT_SLOT_CAPACITY = 5;
export const NEAR_TERM_BUFFER_MAX = 60;
export const NEAR_TERM_REFUND_LEAD_MIN = 3;
export const WITHIN_15_MIN_MS = 15 * 60 * 1000;

export type BookableSlot = {
  id: string;
  startAt: string;
  startMs: number;
  label: string;
  displayLabel: string;
  remaining: number;
};

export type ScheduleConfig = {
  bufferMin: number;
  slotIntervalMin: number;
  availFrom: string;
  availTo: string;
  bookableDays: number;
  bookingOpen: boolean;
  slotCapacity?: number;
};

export function stockKey(momentId: string, slotId: string): string {
  return `${momentId}:${slotId}`;
}

function parseHm(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatHm(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function roundUpToInterval(date: Date, intervalMin: number): Date {
  const ms = intervalMin * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatSlotDisplayLabel(start: Date, now: Date): string {
  const hm = formatHm(start);
  if (isSameDay(start, now)) return `今天 ${hm}`;
  const tomorrow = addDays(startOfDay(now), 1);
  if (isSameDay(start, tomorrow)) return `明天 ${hm}`;
  return `${start.getMonth() + 1}/${start.getDate()} ${hm}`;
}

export function formatEarliestCapsule(start: Date, now: Date): string {
  const hm = formatHm(start);
  if (isSameDay(start, now)) return hm;
  const tomorrow = addDays(startOfDay(now), 1);
  if (isSameDay(start, tomorrow)) return `明天 ${hm}`;
  return `${start.getMonth() + 1}/${start.getDate()} ${hm}`;
}

export function getBookableDates(
  config: ScheduleConfig,
  now = new Date(),
): Date[] {
  if (!config.bookingOpen) return [];
  const days: Date[] = [];
  const base = startOfDay(now);
  for (let i = 0; i < config.bookableDays; i += 1) {
    days.push(addDays(base, i));
  }
  return days;
}

export function listSlotsForDay(
  momentId: string,
  config: ScheduleConfig,
  day: Date,
  now = new Date(),
  getRemaining: (momentId: string, slotId: string) => number = () =>
    config.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
): BookableSlot[] {
  if (!config.bookingOpen) return [];

  const interval = config.slotIntervalMin;
  const fromMin = parseHm(config.availFrom);
  const toMin = parseHm(config.availTo);
  if (interval <= 0 || fromMin >= toMin) return [];

  const dayStart = startOfDay(day);
  const windowStart = new Date(dayStart);
  windowStart.setHours(Math.floor(fromMin / 60), fromMin % 60, 0, 0);
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(Math.floor(toMin / 60), toMin % 60, 0, 0);

  let cursor: Date;
  if (isSameDay(day, now)) {
    const earliest = roundUpToInterval(
      new Date(now.getTime() + config.bufferMin * 60 * 1000),
      interval,
    );
    cursor = earliest > windowStart ? earliest : windowStart;
  } else {
    cursor = new Date(windowStart);
  }

  const slots: BookableSlot[] = [];
  while (cursor < windowEnd) {
    const startMs = cursor.getTime();
    const id = new Date(startMs).toISOString();
    const remaining = getRemaining(momentId, id);
    slots.push({
      id,
      startAt: id,
      startMs,
      label: formatHm(cursor),
      displayLabel: formatSlotDisplayLabel(cursor, now),
      remaining,
    });
    cursor = new Date(cursor.getTime() + interval * 60 * 1000);
  }
  return slots;
}

export function listAllBookableSlots(
  momentId: string,
  config: ScheduleConfig,
  now = new Date(),
  getRemaining?: (momentId: string, slotId: string) => number,
): BookableSlot[] {
  const resolveRemaining =
    getRemaining ??
    ((_momentId, _slotId) => config.slotCapacity ?? DEFAULT_SLOT_CAPACITY);
  return getBookableDates(config, now).flatMap((day) =>
    listSlotsForDay(momentId, config, day, now, resolveRemaining),
  );
}

export function getEarliestBookable(
  momentId: string,
  config: ScheduleConfig,
  now = new Date(),
  getRemaining?: (momentId: string, slotId: string) => number,
): BookableSlot | null {
  const slots = listAllBookableSlots(momentId, config, now, getRemaining);
  return slots.find((slot) => slot.remaining > 0) ?? null;
}

export function findBookableSlot(
  momentId: string,
  config: ScheduleConfig,
  slotId: string,
  now = new Date(),
  getRemaining?: (momentId: string, slotId: string) => number,
): BookableSlot | null {
  return (
    listAllBookableSlots(momentId, config, now, getRemaining).find(
      (slot) => slot.id === slotId,
    ) ?? null
  );
}

export function isNearTermSchedule(config: ScheduleConfig): boolean {
  return config.bufferMin < NEAR_TERM_BUFFER_MAX;
}

export function formatDateChip(day: Date, now: Date): string {
  const week = ['日', '一', '二', '三', '四', '五', '六'][day.getDay()];
  if (isSameDay(day, now)) return `今天\n周${week}`;
  const tomorrow = addDays(startOfDay(now), 1);
  if (isSameDay(day, tomorrow)) return `明天\n周${week}`;
  return `${day.getMonth() + 1}/${day.getDate()}\n周${week}`;
}

export function dayKey(day: Date): string {
  return `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** 从 launch 草稿构建预览用 ScheduleConfig */
export function scheduleFromDraft(input: {
  bookingOpen: boolean;
  bufferMin: number;
  slotIntervalMin: number;
  availFrom: string;
  availTo: string;
  bookableDays: number;
}): ScheduleConfig {
  return {
    bookingOpen: input.bookingOpen,
    bufferMin: input.bufferMin,
    slotIntervalMin: input.slotIntervalMin,
    availFrom: input.availFrom,
    availTo: input.availTo,
    bookableDays: input.bookableDays,
    slotCapacity: DEFAULT_SLOT_CAPACITY,
  };
}

/** legacy → 新排期字段 */
export function migrateScheduleFields(
  legacy: Partial<MomentItem> & {
    asapEnabled?: boolean;
    acceptingPaused?: boolean;
  },
): ScheduleConfig {
  const bookingOpen =
    legacy.bookingOpen ??
    (legacy.asapEnabled !== false && legacy.acceptingPaused !== true);
  return {
    bufferMin: legacy.bufferMin ?? 15,
    slotIntervalMin: legacy.slotIntervalMin ?? 30,
    availFrom: legacy.availFrom ?? '09:00',
    availTo: legacy.availTo ?? '22:00',
    bookableDays: legacy.bookableDays ?? 7,
    bookingOpen,
    slotCapacity: legacy.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
  };
}
