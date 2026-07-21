import type { InteractionForm, MomentItem } from '../data/mock';
import {
  listAllBookableSlots,
  migrateScheduleFields,
} from '../utils/bookingSlots';
import { getRemainingStock, type Order } from './orderStore';

export type SkuFulfillmentStats = {
  pendingConfirm: number;
  waitingFulfill: number;
  inProgress: number;
  completedToday: number;
  slotRemaining: number;
};

export function getSkuFulfillmentStats(
  form: InteractionForm,
  orders: Order[],
  listing: MomentItem | undefined,
): SkuFulfillmentStats {
  const mine = orders.filter((o) => o.form === form);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayTs = startOfDay.getTime();

  let slotRemaining = 0;
  if (listing) {
    slotRemaining = listAllBookableSlots(
      listing.id,
      migrateScheduleFields(listing),
      new Date(),
      getRemainingStock,
    ).reduce((n, slot) => n + slot.remaining, 0);
  }

  return {
    pendingConfirm: mine.filter((o) => o.status === 'pending_confirm').length,
    waitingFulfill: mine.filter((o) => o.status === 'booked').length,
    inProgress: mine.filter((o) => o.status === 'in_progress').length,
    completedToday: mine.filter(
      (o) => o.status === 'completed' && o.createdAt >= dayTs,
    ).length,
    slotRemaining,
  };
}
