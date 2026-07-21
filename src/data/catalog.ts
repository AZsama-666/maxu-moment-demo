import {
  buyerAvailability,
  computeStatusLabel,
  getMoment as getStaticMoment,
  getProvider as getStaticProvider,
  normalizeMomentSchedule,
  moments as staticMoments,
  providers,
  type MomentItem,
  type Provider,
} from './mock';
import {
  findBookableSlot,
  listAllBookableSlots,
  migrateScheduleFields,
  type BookableSlot,
} from '../utils/bookingSlots';
import {
  getOpenSupplyMoments,
  getStaticMetricOverrides,
  getOneToOneSupplyListing,
} from '../state/supplyStore';
import { getRemainingStock } from '../state/orderStore';

function enrichStatic(m: MomentItem): MomentItem {
  const ov = getStaticMetricOverrides(m.id);
  const normalized = normalizeMomentSchedule(m);
  if (!ov) {
    return {
      ...normalized,
      statusLabel: computeStatusLabel(normalized, new Date(), getRemainingStock),
    };
  }
  const next = normalizeMomentSchedule({
    ...normalized,
    fulfilledCount: ov.fulfilledCount,
    bookingOpen: ov.bookingOpen ?? normalized.bookingOpen,
  });
  return {
    ...next,
    statusLabel: computeStatusLabel(next, new Date(), getRemainingStock),
  };
}

export function listBrowseMoments(): MomentItem[] {
  return [...getOpenSupplyMoments(), ...staticMoments.map(enrichStatic)];
}

export function getMoment(id: string): MomentItem | undefined {
  const fromSupply = getOneToOneSupplyListing(id);
  if (fromSupply) {
    const { status: _s, createdAt: _c, kind: _k, ...item } = fromSupply;
    const normalized = normalizeMomentSchedule(item);
    return {
      ...normalized,
      statusLabel: computeStatusLabel(normalized, new Date(), getRemainingStock),
    };
  }
  const staticM = getStaticMoment(id);
  return staticM ? enrichStatic(staticM) : undefined;
}

export function getProvider(id: string): Provider | undefined {
  return getStaticProvider(id) ?? providers.find((p) => p.id === id);
}

export function getBookableSlot(
  momentId: string,
  slotId: string,
): BookableSlot | undefined {
  const moment = getMoment(momentId);
  if (!moment) return undefined;
  const config = migrateScheduleFields(moment);
  return (
    findBookableSlot(momentId, config, slotId, new Date(), getRemainingStock) ??
    undefined
  );
}

/** @deprecated 使用 getBookableSlot */
export function getSlot(momentId: string, slotId: string) {
  const slot = getBookableSlot(momentId, slotId);
  if (!slot) return undefined;
  return {
    id: slot.id,
    label: slot.displayLabel,
    startAt: slot.startAt,
    remaining: slot.remaining,
  };
}

export function listMomentBookableSlots(momentId: string): BookableSlot[] {
  const moment = getMoment(momentId);
  if (!moment) return [];
  return listAllBookableSlots(
    momentId,
    migrateScheduleFields(moment),
    new Date(),
    getRemainingStock,
  );
}

export function listMomentsByProvider(providerId: string): MomentItem[] {
  return listBrowseMoments().filter((m) => m.providerId === providerId);
}

export function listBookableMoments(): MomentItem[] {
  return listBrowseMoments().filter(
    (m) =>
      buyerAvailability(m, new Date(), getRemainingStock).kind === 'available',
  );
}
