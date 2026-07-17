import { useSyncExternalStore } from 'react';
import {
  SELF_PROVIDER_ID,
  computeStatusLabel,
  type InteractionForm,
  type MomentItem,
  type Slot,
} from '../data/mock';

export type SupplyStatus = 'open' | 'offline';

export type SupplyListing = MomentItem & {
  status: SupplyStatus;
  createdAt: number;
};

export type CreateMomentInput = {
  form: InteractionForm;
  title: string;
  durationSec: number;
  priceYuan: number;
  slots: { label: string; remaining: number }[];
  asapEnabled: boolean;
};

export type UpdateSupplyInput = {
  asapEnabled?: boolean;
  acceptingPaused?: boolean;
  status?: SupplyStatus;
  slots?: Slot[];
  priceYuan?: number;
  title?: string;
};

const STORAGE_KEY = 'maxu-moment-demo-supply-v3';

type Snapshot = { listings: SupplyListing[] };

let snapshot: Snapshot = load();
const listeners = new Set<() => void>();

function load(): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // migrate from v2 if present
      const legacy = localStorage.getItem('maxu-moment-demo-supply-v2');
      if (legacy) {
        const listings = (JSON.parse(legacy) as Array<SupplyListing & { online?: boolean }>).map(
          normalizeListing,
        );
        return { listings };
      }
      return { listings: [] };
    }
    return { listings: (JSON.parse(raw) as SupplyListing[]).map(normalizeListing) };
  } catch {
    return { listings: [] };
  }
}

function normalizeListing(l: SupplyListing & { online?: boolean }): SupplyListing {
  const acceptingPaused =
    l.acceptingPaused ??
    (typeof l.online === 'boolean' ? !l.online : false);
  const base = {
    ...l,
    asapEnabled: l.asapEnabled ?? true,
    acceptingPaused,
    fulfilledCount: l.fulfilledCount ?? 0,
    avgResponseMin: l.avgResponseMin ?? 0,
    slots: l.slots ?? [],
  };
  return {
    ...base,
    statusLabel: computeStatusLabel(base),
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.listings));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function toMomentItem(listing: SupplyListing): MomentItem {
  const { status: _s, createdAt: _c, ...item } = listing;
  return { ...item, statusLabel: computeStatusLabel(listing) };
}

/** 同 form 仅一条开放 SKU：若已有则更新，否则新建 */
export function createSupplyMoment(input: CreateMomentInput): SupplyListing {
  const existing = snapshot.listings.find(
    (l) => l.form === input.form && l.status === 'open',
  );
  const slots: Slot[] = input.slots.map((s, i) => ({
    id: `${existing?.id ?? `m-self-${Date.now()}`}-s${i + 1}`,
    label: s.label,
    startAt: `slot-${i + 1}`,
    remaining: s.remaining,
  }));

  if (existing) {
    const updated: SupplyListing = {
      ...existing,
      title: input.title.trim(),
      durationSec: input.durationSec,
      priceYuan: input.priceYuan,
      slots: slots.length > 0 ? slots : existing.slots,
      asapEnabled: input.asapEnabled,
      acceptingPaused: false,
      statusLabel: computeStatusLabel({
        asapEnabled: input.asapEnabled,
        acceptingPaused: false,
        slots: slots.length > 0 ? slots : existing.slots,
        avgResponseMin: existing.avgResponseMin,
      }),
    };
    snapshot = {
      listings: snapshot.listings.map((l) => (l.id === existing.id ? updated : l)),
    };
    emit();
    return updated;
  }

  const id = `m-self-${Date.now()}`;
  const listing: SupplyListing = {
    id,
    title: input.title.trim(),
    providerId: SELF_PROVIDER_ID,
    form: input.form,
    sceneTag: input.form === 'voice' ? '语音互动' : '视频互动',
    description:
      input.form === 'voice'
        ? '长期开放的语音专属时刻，支持尽快接单或预约档期。'
        : '长期开放的视频专属时刻，支持尽快接单或预约档期。',
    durationSec: input.durationSec,
    priceYuan: input.priceYuan,
    slots,
    asapEnabled: input.asapEnabled,
    acceptingPaused: false,
    fulfilledCount: 0,
    avgResponseMin: 0,
    statusLabel: computeStatusLabel({
      asapEnabled: input.asapEnabled,
      acceptingPaused: false,
      slots,
      avgResponseMin: 0,
    }),
    status: 'open',
    createdAt: Date.now(),
  };

  snapshot = { listings: [listing, ...snapshot.listings] };
  emit();
  return listing;
}

export function updateSupplyMoment(id: string, patch: UpdateSupplyInput) {
  snapshot = {
    listings: snapshot.listings.map((l) => {
      if (l.id !== id) return l;
      const next = { ...l, ...patch };
      if (patch.status === 'offline') {
        next.acceptingPaused = true;
      }
      next.statusLabel = computeStatusLabel(next);
      if (patch.status) next.status = patch.status;
      return next;
    }),
  };
  emit();
}

export function setSupplyStatus(id: string, status: SupplyStatus) {
  updateSupplyMoment(id, {
    status,
    acceptingPaused: status !== 'open',
  });
}

export function recordSupplyResponse(momentId: string, responseMin: number) {
  snapshot = {
    listings: snapshot.listings.map((l) => {
      if (l.id !== momentId) return l;
      const nextCount = l.fulfilledCount + 1;
      const prevTotal = l.avgResponseMin * l.fulfilledCount;
      const avgResponseMin =
        nextCount === 0 ? responseMin : Math.round((prevTotal + responseMin) / nextCount);
      return {
        ...l,
        fulfilledCount: nextCount,
        avgResponseMin: Math.max(1, avgResponseMin),
        statusLabel: computeStatusLabel(l),
      };
    }),
  };
  emit();
}

type StaticMetric = {
  fulfilledCount: number;
  avgResponseMin: number;
  acceptingPaused: boolean;
};

const staticMetrics: Record<string, StaticMetric> = {};

export function getStaticMetricOverrides(momentId: string) {
  return staticMetrics[momentId];
}

export function recordStaticResponse(
  momentId: string,
  base: { fulfilledCount: number; avgResponseMin: number; acceptingPaused: boolean },
  responseMin: number,
) {
  const cur = staticMetrics[momentId] ?? { ...base };
  const nextCount = cur.fulfilledCount + 1;
  const avg = Math.round((cur.avgResponseMin * cur.fulfilledCount + responseMin) / nextCount);
  staticMetrics[momentId] = {
    ...cur,
    fulfilledCount: nextCount,
    avgResponseMin: Math.max(1, avg),
  };
  emit();
}

export function setStaticPaused(
  momentId: string,
  acceptingPaused: boolean,
  base: { fulfilledCount: number; avgResponseMin: number },
) {
  const cur = staticMetrics[momentId] ?? { ...base, acceptingPaused };
  staticMetrics[momentId] = { ...cur, acceptingPaused };
  emit();
}

export function getSupplyListing(id: string) {
  return snapshot.listings.find((l) => l.id === id);
}

export function getOpenListingByForm(form: InteractionForm): SupplyListing | undefined {
  return snapshot.listings.find((l) => l.form === form && l.status === 'open');
}

export function getOpenSupplyMoments(): MomentItem[] {
  return snapshot.listings.filter((l) => l.status === 'open').map(toMomentItem);
}

export function hasOpenSupplyMoments() {
  return snapshot.listings.some((l) => l.status === 'open');
}

export function useSupplyListings() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).listings;
}

export function useOpenSupplyMoments(): MomentItem[] {
  const listings = useSupplyListings();
  return listings.filter((l) => l.status === 'open').map(toMomentItem);
}

export function useSupplyTick() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
