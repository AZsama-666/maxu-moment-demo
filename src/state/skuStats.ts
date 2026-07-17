import type { InteractionForm, MomentItem } from '../data/mock';
import type { Order } from './orderStore';

export type SkuFulfillmentStats = {
  pendingAccept: number;
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

  return {
    pendingAccept: mine.filter((o) => o.status === 'pending_accept').length,
    waitingFulfill: mine.filter(
      (o) => o.status === 'accepted' || o.status === 'booked',
    ).length,
    inProgress: mine.filter((o) => o.status === 'in_progress').length,
    completedToday: mine.filter(
      (o) => o.status === 'completed' && o.createdAt >= dayTs,
    ).length,
    slotRemaining: listing
      ? listing.slots.reduce((n, s) => n + s.remaining, 0)
      : 0,
  };
}
