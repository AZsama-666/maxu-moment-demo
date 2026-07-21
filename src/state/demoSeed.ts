import { SELF_PROVIDER_ID } from '../data/mock';
import {
  formatSlotDisplayLabel,
  isNearTermSlot,
  roundUpToInterval,
  SLOT_INTERVAL_MIN,
} from '../utils/bookingSlots';
import type { Order } from './orderStore';
import type { OneToOneSupplyListing } from './supplyStore';

const DEMO_BUYER_NAME = '访客买家';

export function demoSupplyOrderId(momentId: string): string {
  return `ord-demo-${momentId}`;
}

function hasActiveSupplyOrder(orders: Order[], momentId: string): boolean {
  return orders.some(
    (order) =>
      order.providerId === SELF_PROVIDER_ID &&
      order.momentId === momentId &&
      (order.status === 'booked' || order.status === 'in_progress'),
  );
}

export function buildDemoSupplyOrderForListing(
  listing: OneToOneSupplyListing,
): Order {
  const now = new Date();
  const slotStart = roundUpToInterval(
    new Date(now.getTime() + 25 * 60 * 1000),
    SLOT_INTERVAL_MIN,
  );
  const slotStartAt = slotStart.getTime();

  return {
    id: demoSupplyOrderId(listing.id),
    momentId: listing.id,
    slotId: slotStart.toISOString(),
    form: listing.form,
    title: listing.title,
    providerName: '玛薯',
    providerId: SELF_PROVIDER_ID,
    buyerName: DEMO_BUYER_NAME,
    slotLabel: formatSlotDisplayLabel(slotStart, now),
    slotStartAt,
    nearTerm: isNearTermSlot(slotStartAt),
    providerReady: false,
    buyerReady: false,
    priceYuan: listing.priceYuan,
    durationSec: listing.durationSec,
    quantity: 1,
    payMethod: 'cash',
    timing: 'scheduled',
    status: 'booked',
    createdAt: Date.now(),
    paidAt: Date.now(),
  };
}

/** 发起 1V1 后注入「访客买家已预约」的 mock 单 */
export function createDemoSupplyOrderForListing(
  listing: OneToOneSupplyListing,
  orders: Order[],
): Order | null {
  if (hasActiveSupplyOrder(orders, listing.id)) return null;
  const orderId = demoSupplyOrderId(listing.id);
  if (orders.some((order) => order.id === orderId)) return null;
  return buildDemoSupplyOrderForListing(listing);
}
