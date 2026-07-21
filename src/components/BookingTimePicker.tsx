import { useEffect, useMemo, useState } from 'react';
import type { MomentItem } from '../data/mock';
import {
  dayKey,
  formatDateChip,
  getBookableDates,
  listSlotsForDay,
  migrateScheduleFields,
  type BookableSlot,
} from '../utils/bookingSlots';
import { getRemainingStock } from '../state/orderStore';

type Props = {
  moment: MomentItem;
  selectedSlotId?: string;
  onSelect: (slot: BookableSlot) => void;
};

export function BookingTimePicker({ moment, selectedSlotId, onSelect }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const config = migrateScheduleFields(moment);
  const dates = useMemo(
    () => getBookableDates(config, now),
    [config, now],
  );
  const [activeDayKey, setActiveDayKey] = useState(() =>
    dates[0] ? dayKey(dates[0]) : '',
  );

  useEffect(() => {
    if (dates.length === 0) return;
    if (!dates.some((day) => dayKey(day) === activeDayKey)) {
      setActiveDayKey(dayKey(dates[0]));
    }
  }, [dates, activeDayKey]);

  const activeDay = dates.find((day) => dayKey(day) === activeDayKey) ?? dates[0];
  const daySlots = activeDay
    ? listSlotsForDay(moment.id, config, activeDay, now, getRemainingStock)
    : [];

  const firstAvailable = useMemo(() => {
    for (const day of dates) {
      const slots = listSlotsForDay(
        moment.id,
        config,
        day,
        now,
        getRemainingStock,
      );
      const open = slots.find((slot) => slot.remaining > 0);
      if (open) return open;
    }
    return null;
  }, [moment.id, config, dates, now]);

  useEffect(() => {
    if (!selectedSlotId && firstAvailable) {
      onSelect(firstAvailable);
    }
  }, [firstAvailable, onSelect, selectedSlotId]);

  if (dates.length === 0) {
    return <p className="empty-inline">暂无可预约时间</p>;
  }

  const visibleSlots = showAll ? daySlots : daySlots.slice(0, 8);

  return (
    <div className="booking-picker">
      <div className="book-date-row" role="tablist" aria-label="可订日期">
        {dates.map((day) => {
          const key = dayKey(day);
          const label = formatDateChip(day, now);
          const [top, bottom] = label.split('\n');
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === activeDayKey}
              className={`book-date-chip ${
                key === activeDayKey ? 'book-date-chip--active' : ''
              }`}
              onClick={() => {
                setActiveDayKey(key);
                setShowAll(false);
              }}
            >
              <strong>{top}</strong>
              <span>{bottom}</span>
            </button>
          );
        })}
      </div>

      <div className="book-time-row" role="listbox" aria-label="可订时段">
        {visibleSlots.map((slot) => {
          const full = slot.remaining <= 0;
          const active = slot.id === selectedSlotId;
          return (
            <button
              key={slot.id}
              type="button"
              role="option"
              aria-selected={active}
              disabled={full}
              className={`book-time-chip ${
                active ? 'book-time-chip--active' : ''
              } ${full ? 'book-time-chip--full' : ''}`}
              onClick={() => onSelect(slot)}
            >
              <strong>{slot.label}</strong>
              <span className="muted">{full ? '已满' : '空闲'}</span>
            </button>
          );
        })}
        {daySlots.length > 8 && !showAll && (
          <button
            type="button"
            className="book-time-chip book-time-chip--more"
            onClick={() => setShowAll(true)}
          >
            <strong>全部时间</strong>
            <span className="muted">›</span>
          </button>
        )}
      </div>

      {showAll && daySlots.length > 8 && (
        <button
          type="button"
          className="text-link book-time-collapse"
          onClick={() => setShowAll(false)}
        >
          收起
        </button>
      )}
    </div>
  );
}

export function useSelectedBookableSlot(
  moment: MomentItem | undefined,
  slotId: string | undefined,
) {
  const now = new Date();
  if (!moment || !slotId) return null;
  const config = migrateScheduleFields(moment);
  const dates = getBookableDates(config, now);
  for (const day of dates) {
    const slots = listSlotsForDay(
      moment.id,
      config,
      day,
      now,
      getRemainingStock,
    );
    const hit = slots.find((slot) => slot.id === slotId);
    if (hit) return hit;
  }
  return null;
}
