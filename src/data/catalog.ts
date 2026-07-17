import {
  computeStatusLabel,
  getMoment as getStaticMoment,
  getProvider as getStaticProvider,
  isAcceptingNow,
  moments as staticMoments,
  providers,
  type MomentItem,
  type Provider,
} from './mock';
import {
  getOpenSupplyMoments,
  getStaticMetricOverrides,
  getSupplyListing,
} from '../state/supplyStore';

function enrichStatic(m: MomentItem): MomentItem {
  const ov = getStaticMetricOverrides(m.id);
  if (!ov) return m;
  const next = {
    ...m,
    fulfilledCount: ov.fulfilledCount,
    avgResponseMin: ov.avgResponseMin,
    acceptingPaused: ov.acceptingPaused,
  };
  return { ...next, statusLabel: computeStatusLabel(next) };
}

export function listBrowseMoments(): MomentItem[] {
  return [...getOpenSupplyMoments(), ...staticMoments.map(enrichStatic)];
}

export function getMoment(id: string): MomentItem | undefined {
  const fromSupply = getSupplyListing(id);
  if (fromSupply) {
    const { status: _s, createdAt: _c, ...item } = fromSupply;
    return {
      ...item,
      statusLabel: computeStatusLabel(fromSupply),
    };
  }
  const staticM = getStaticMoment(id);
  return staticM ? enrichStatic(staticM) : undefined;
}

export function getProvider(id: string): Provider | undefined {
  return getStaticProvider(id) ?? providers.find((p) => p.id === id);
}

export function getSlot(momentId: string, slotId: string) {
  return getMoment(momentId)?.slots.find((s) => s.id === slotId);
}

export function listMomentsByProvider(providerId: string): MomentItem[] {
  return listBrowseMoments().filter((m) => m.providerId === providerId);
}

export function listAsapMoments(): MomentItem[] {
  return listBrowseMoments().filter((m) => isAcceptingNow(m));
}

export function listScheduledMoments(): MomentItem[] {
  return listBrowseMoments().filter((m) => m.slots.some((s) => s.remaining > 0));
}
