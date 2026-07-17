import { useSyncExternalStore } from 'react';
import {
  SELF_PROVIDER_ID,
  computeStatusLabel,
  type InteractionForm,
  type MomentItem,
  type SkuType,
  type Slot,
} from '../data/mock';

export type SupplyStatus = 'open' | 'offline';

export type OneToOneSupplyListing = MomentItem & {
  kind: '1v1';
  status: SupplyStatus;
  createdAt: number;
};

export type CompanionSupplyListing = {
  kind: 'companion';
  id: string;
  skuType: 'companion';
  title: string;
  providerId: string;
  description: string;
  priceYuan: number;
  unitLabel: string;
  serviceTime: string;
  placeLabel: string;
  seats: number;
  remaining: number;
  status: SupplyStatus;
  createdAt: number;
};

export type SupplyListing = OneToOneSupplyListing | CompanionSupplyListing;

export type CreateMomentInput = {
  form: InteractionForm;
  title: string;
  description?: string;
  durationSec: number;
  priceYuan: number;
  slots: { label: string; remaining: number }[];
  asapEnabled: boolean;
};

export type CreateCompanionInput = {
  title: string;
  description: string;
  priceYuan: number;
  unitLabel: string;
  serviceTime: string;
  placeLabel: string;
  seats: number;
};

export type UpdateSupplyInput = {
  asapEnabled?: boolean;
  acceptingPaused?: boolean;
  status?: SupplyStatus;
  slots?: Slot[];
  priceYuan?: number;
  title?: string;
  description?: string;
  durationSec?: number;
};

const STORAGE_KEY = 'maxu-moment-demo-supply-v4';
const LEGACY_KEYS = [
  'maxu-moment-demo-supply-v3',
  'maxu-moment-demo-supply-v2',
];

type Snapshot = { listings: SupplyListing[] };

let snapshot: Snapshot = load();
const listeners = new Set<() => void>();

function load(): Snapshot {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      return {
        listings: (JSON.parse(current) as SupplyListing[]).map(normalizeListing),
      };
    }

    const legacyRaw = LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    if (!legacyRaw) return { listings: [] };
    const legacy = JSON.parse(legacyRaw) as SupplyListing[];
    return { listings: legacy.map(normalizeListing) };
  } catch {
    return { listings: [] };
  }
}

function normalizeListing(
  listing: SupplyListing & { online?: boolean; kind?: '1v1' | 'companion' },
): SupplyListing {
  if (listing.kind === 'companion') {
    return {
      ...listing,
      skuType: 'companion',
      remaining: listing.remaining ?? listing.seats ?? 1,
      status: listing.status ?? 'open',
    };
  }

  const legacy = listing as OneToOneSupplyListing & { online?: boolean };
  const acceptingPaused =
    legacy.acceptingPaused ??
    (typeof legacy.online === 'boolean' ? !legacy.online : false);
  const base = {
    ...legacy,
    kind: '1v1' as const,
    asapEnabled: legacy.asapEnabled ?? true,
    acceptingPaused,
    fulfilledCount: legacy.fulfilledCount ?? 0,
    avgResponseMin: legacy.avgResponseMin ?? 0,
    slots: legacy.slots ?? [],
    status: legacy.status ?? 'open',
    createdAt: legacy.createdAt ?? Date.now(),
  };
  return { ...base, statusLabel: computeStatusLabel(base) };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.listings));
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function toMomentItem(listing: OneToOneSupplyListing): MomentItem {
  const { status: _status, createdAt: _createdAt, kind: _kind, ...item } = listing;
  return { ...item, statusLabel: computeStatusLabel(listing) };
}

export function createSupplyMoment(input: CreateMomentInput): OneToOneSupplyListing {
  const existing = snapshot.listings.find(
    (listing): listing is OneToOneSupplyListing =>
      listing.kind === '1v1' && listing.form === input.form,
  );
  const id = existing?.id ?? `m-self-${Date.now()}`;
  const slots: Slot[] = input.slots.map((slot, index) => ({
    id: `${id}-s${index + 1}`,
    label: slot.label,
    startAt: `slot-${index + 1}`,
    remaining: slot.remaining,
  }));

  const listing: OneToOneSupplyListing = {
    kind: '1v1',
    id,
    title: input.title.trim(),
    providerId: SELF_PROVIDER_ID,
    form: input.form,
    sceneTag: input.form === 'voice' ? '语音互动' : '视频互动',
    description:
      input.description?.trim() ||
      (input.form === 'voice'
        ? '长期开放的语音专属时刻，支持实时接单或预约档期。'
        : '长期开放的视频专属时刻，支持实时接单或预约档期。'),
    durationSec: input.durationSec,
    priceYuan: input.priceYuan,
    slots,
    asapEnabled: input.asapEnabled,
    acceptingPaused: false,
    fulfilledCount: existing?.fulfilledCount ?? 0,
    avgResponseMin: existing?.avgResponseMin ?? 0,
    statusLabel: '',
    status: existing?.status ?? 'open',
    createdAt: existing?.createdAt ?? Date.now(),
  };
  listing.statusLabel = computeStatusLabel(listing);

  snapshot = {
    listings: existing
      ? snapshot.listings.map((item) => (item.id === existing.id ? listing : item))
      : [listing, ...snapshot.listings],
  };
  emit();
  return listing;
}

export function createCompanionSupply(
  input: CreateCompanionInput,
): CompanionSupplyListing {
  const listing: CompanionSupplyListing = {
    kind: 'companion',
    skuType: 'companion',
    id: `c-self-${Date.now()}`,
    title: input.title.trim(),
    providerId: SELF_PROVIDER_ID,
    description: input.description.trim(),
    priceYuan: input.priceYuan,
    unitLabel: input.unitLabel.trim() || '1 小时/份',
    serviceTime: input.serviceTime.trim(),
    placeLabel: input.placeLabel.trim(),
    seats: input.seats,
    remaining: input.seats,
    status: 'open',
    createdAt: Date.now(),
  };
  snapshot = { listings: [listing, ...snapshot.listings] };
  emit();
  return listing;
}

export function updateSupplyMoment(id: string, patch: UpdateSupplyInput) {
  snapshot = {
    listings: snapshot.listings.map((listing) => {
      if (listing.id !== id || listing.kind !== '1v1') return listing;
      const next = { ...listing, ...patch };
      if (patch.status === 'offline') next.acceptingPaused = true;
      if (patch.status === 'open' && !next.asapEnabled) next.acceptingPaused = false;
      next.statusLabel = computeStatusLabel(next);
      return next;
    }),
  };
  emit();
}

export function updateCompanionSupply(
  id: string,
  patch: Partial<Omit<CompanionSupplyListing, 'id' | 'kind' | 'skuType' | 'createdAt'>>,
) {
  snapshot = {
    listings: snapshot.listings.map((listing) =>
      listing.id === id && listing.kind === 'companion'
        ? { ...listing, ...patch }
        : listing,
    ),
  };
  emit();
}

export function setSupplyStatus(id: string, status: SupplyStatus) {
  const listing = getSupplyListing(id);
  if (!listing) return;
  if (listing.kind === '1v1') {
    updateSupplyMoment(id, {
      status,
      acceptingPaused: status === 'offline',
    });
  } else {
    updateCompanionSupply(id, { status });
  }
}

export function recordSupplyResponse(momentId: string, responseMin: number) {
  snapshot = {
    listings: snapshot.listings.map((listing) => {
      if (listing.id !== momentId || listing.kind !== '1v1') return listing;
      const nextCount = listing.fulfilledCount + 1;
      const previousTotal = listing.avgResponseMin * listing.fulfilledCount;
      const avgResponseMin = Math.round(
        (previousTotal + responseMin) / Math.max(1, nextCount),
      );
      const next = {
        ...listing,
        fulfilledCount: nextCount,
        avgResponseMin: Math.max(1, avgResponseMin),
      };
      return { ...next, statusLabel: computeStatusLabel(next) };
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
  base: StaticMetric,
  responseMin: number,
) {
  const current = staticMetrics[momentId] ?? { ...base };
  const nextCount = current.fulfilledCount + 1;
  const avg = Math.round(
    (current.avgResponseMin * current.fulfilledCount + responseMin) / nextCount,
  );
  staticMetrics[momentId] = {
    ...current,
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
  const current = staticMetrics[momentId] ?? { ...base, acceptingPaused };
  staticMetrics[momentId] = { ...current, acceptingPaused };
  emit();
}

export function getSupplyListing(id: string) {
  return snapshot.listings.find((listing) => listing.id === id);
}

export function getOneToOneSupplyListing(id: string) {
  const listing = getSupplyListing(id);
  return listing?.kind === '1v1' ? listing : undefined;
}

export function getOpenListingByForm(form: InteractionForm) {
  return snapshot.listings.find(
    (listing): listing is OneToOneSupplyListing =>
      listing.kind === '1v1' &&
      listing.form === form &&
      listing.status === 'open',
  );
}

export function getListingBySkuType(skuType: SkuType) {
  if (skuType === 'companion') {
    return snapshot.listings.filter(
      (listing): listing is CompanionSupplyListing =>
        listing.kind === 'companion',
    );
  }
  return snapshot.listings.find(
    (listing): listing is OneToOneSupplyListing =>
      listing.kind === '1v1' && listing.form === skuType,
  );
}

export function getOpenSupplyMoments(): MomentItem[] {
  return snapshot.listings
    .filter(
      (listing): listing is OneToOneSupplyListing =>
        listing.kind === '1v1' && listing.status === 'open',
    )
    .map(toMomentItem);
}

export function getOpenCompanionListings(): CompanionSupplyListing[] {
  return snapshot.listings.filter(
    (listing): listing is CompanionSupplyListing =>
      listing.kind === 'companion' && listing.status === 'open',
  );
}

export function hasOpenSupplyMoments() {
  return snapshot.listings.some(
    (listing) => listing.kind === '1v1' && listing.status === 'open',
  );
}

export function useSupplyListings() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).listings;
}

export function useOpenSupplyMoments(): MomentItem[] {
  const listings = useSupplyListings();
  return listings
    .filter(
      (listing): listing is OneToOneSupplyListing =>
        listing.kind === '1v1' && listing.status === 'open',
    )
    .map(toMomentItem);
}

export function useSupplyTick() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
