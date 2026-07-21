import type { MomentItem } from '../data/mock';

export const MIN_LEAD_MIN = 5;
export const SLOT_INTERVAL_MIN = 15;
export const BOOKABLE_DAYS = 7;
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
  /** @deprecated 平台固定 MIN_LEAD_MIN，不再读取 */
  bufferMin?: number;
  /** @deprecated 平台固定 SLOT_INTERVAL_MIN，不再读取 */
  slotIntervalMin?: number;
  availFrom: string;
  availTo: string;
  bookableDays: number;
  bookingOpen: boolean;
  slotCapacity?: number;
};

export type BookingStatus = {
  inBusiness: boolean;
  earliestSlot?: BookableSlot;
  nextOpenAt?: Date;
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

export function isCrossMidnight(config: ScheduleConfig): boolean {
  return parseHm(config.availTo) <= parseHm(config.availFrom);
}

export function isWithinBusinessHours(
  now = new Date(),
  config: ScheduleConfig,
): boolean {
  if (!config.bookingOpen) return false;
  const fromMin = parseHm(config.availFrom);
  const toMin = parseHm(config.availTo);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (!isCrossMidnight(config)) {
    return nowMin >= fromMin && nowMin < toMin;
  }
  return nowMin >= fromMin || nowMin < toMin;
}

export function getBusinessWindowForDay(
  day: Date,
  config: ScheduleConfig,
): { windowStart: Date; windowEnd: Date } {
  const fromMin = parseHm(config.availFrom);
  const toMin = parseHm(config.availTo);
  const dayStart = startOfDay(day);
  const windowStart = new Date(dayStart);
  windowStart.setHours(Math.floor(fromMin / 60), fromMin % 60, 0, 0);

  if (!isCrossMidnight(config)) {
    const windowEnd = new Date(dayStart);
    windowEnd.setHours(Math.floor(toMin / 60), toMin % 60, 0, 0);
    return { windowStart, windowEnd };
  }

  const windowEnd = addDays(dayStart, 1);
  windowEnd.setHours(Math.floor(toMin / 60), toMin % 60, 0, 0);
  return { windowStart, windowEnd };
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

export function slotSpanForDuration(durationSec: number): number {
  const durationMin = Math.max(1, Math.ceil(durationSec / 60));
  return Math.max(1, Math.ceil(durationMin / SLOT_INTERVAL_MIN));
}

export function getBookableDates(
  config: ScheduleConfig,
  now = new Date(),
): Date[] {
  if (!config.bookingOpen) return [];
  const days: Date[] = [];
  const base = startOfDay(now);
  for (let i = 0; i < BOOKABLE_DAYS; i += 1) {
    days.push(addDays(base, i));
  }
  return days;
}

function earliestAllowedStart(now: Date): Date {
  return roundUpToInterval(
    new Date(now.getTime() + MIN_LEAD_MIN * 60 * 1000),
    SLOT_INTERVAL_MIN,
  );
}

function pushSlot(
  slots: BookableSlot[],
  cursor: Date,
  momentId: string,
  now: Date,
  getRemaining: (momentId: string, slotId: string) => number,
) {
  const startMs = cursor.getTime();
  const id = new Date(startMs).toISOString();
  slots.push({
    id,
    startAt: id,
    startMs,
    label: formatHm(cursor),
    displayLabel: formatSlotDisplayLabel(cursor, now),
    remaining: getRemaining(momentId, id),
  });
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

  const interval = SLOT_INTERVAL_MIN;
  const { windowStart, windowEnd } = getBusinessWindowForDay(day, config);
  const minStart = isSameDay(day, now) ? earliestAllowedStart(now) : windowStart;
  let cursor = minStart > windowStart ? minStart : new Date(windowStart);

  const slots: BookableSlot[] = [];
  while (cursor < windowEnd) {
    pushSlot(slots, cursor, momentId, now, getRemaining);
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

export function getBookingStatus(
  momentId: string,
  config: ScheduleConfig,
  now = new Date(),
  getRemaining?: (momentId: string, slotId: string) => number,
): BookingStatus {
  const inBusiness = isWithinBusinessHours(now, config);
  const earliest = getEarliestBookable(momentId, config, now, getRemaining);
  if (inBusiness && earliest) {
    return { inBusiness: true, earliestSlot: earliest };
  }

  let nextOpenAt: Date | undefined;
  if (!inBusiness && config.bookingOpen) {
    const fromMin = parseHm(config.availFrom);
    const dayStart = startOfDay(now);
    const todayOpen = new Date(dayStart);
    todayOpen.setHours(Math.floor(fromMin / 60), fromMin % 60, 0, 0);
    if (now < todayOpen) {
      nextOpenAt = todayOpen;
    } else {
      const tomorrowOpen = addDays(dayStart, 1);
      tomorrowOpen.setHours(Math.floor(fromMin / 60), fromMin % 60, 0, 0);
      nextOpenAt = tomorrowOpen;
    }
  }

  return {
    inBusiness,
    earliestSlot: earliest ?? undefined,
    nextOpenAt,
  };
}

/** 订单是否近档（距预约 < 60 分钟） */
export function isNearTermSlot(slotStartMs: number, now = Date.now()): boolean {
  return slotStartMs - now < NEAR_TERM_BUFFER_MAX * 60 * 1000;
}

/** @deprecated 使用 isNearTermSlot(slotStartMs) */
export function isNearTermSchedule(_config: ScheduleConfig): boolean {
  return true;
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

export function formatBusinessHoursLabel(config: ScheduleConfig): string {
  if (isCrossMidnight(config)) {
    return `${config.availFrom}–次日 ${config.availTo}`;
  }
  return `${config.availFrom}–${config.availTo}`;
}

export function formatNextOpenLabel(nextOpenAt: Date, now: Date): string {
  const hm = formatHm(nextOpenAt);
  if (isSameDay(nextOpenAt, now)) return `今天 ${hm}`;
  const tomorrow = addDays(startOfDay(now), 1);
  if (isSameDay(nextOpenAt, tomorrow)) return `明天 ${hm}`;
  return `${nextOpenAt.getMonth() + 1}/${nextOpenAt.getDate()} ${hm}`;
}

/** 从 launch 草稿构建预览用 ScheduleConfig */
export function scheduleFromDraft(input: {
  bookingOpen: boolean;
  availFrom: string;
  availTo: string;
}): ScheduleConfig {
  return {
    bookingOpen: input.bookingOpen,
    availFrom: input.availFrom,
    availTo: input.availTo,
    bookableDays: BOOKABLE_DAYS,
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
    availFrom: legacy.availFrom ?? '09:00',
    availTo: legacy.availTo ?? '22:00',
    bookableDays: BOOKABLE_DAYS,
    bookingOpen,
    slotCapacity: legacy.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
  };
}
