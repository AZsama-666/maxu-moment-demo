import { useSyncExternalStore } from 'react';
import {
  SELF_PROVIDER_ID,
  computeStatusLabel,
  normalizeMomentSchedule,
  type InteractionForm,
  type MomentItem,
  type SkuType,
} from '../data/mock';
import { DEFAULT_SLOT_CAPACITY, migrateScheduleFields } from '../utils/bookingSlots';
import { getRemainingStock } from './orderStore';

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
  bufferMin: number;
  slotIntervalMin: number;
  availFrom: string;
  availTo: string;
  bookableDays: number;
  bookingOpen: boolean;
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
  bookingOpen?: boolean;
  status?: SupplyStatus;
  bufferMin?: number;
  slotIntervalMin?: number;
  availFrom?: string;
  availTo?: string;
  bookableDays?: number;
  priceYuan?: number;
  title?: string;
  description?: string;
  durationSec?: number;
};

const STORAGE_KEY = 'maxu-moment-demo-supply-v5';
const LEGACY_KEYS = [
  'maxu-moment-demo-supply-v4',
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

  const legacy = listing as OneToOneSupplyListing & {
    online?: boolean;
    asapEnabled?: boolean;
    acceptingPaused?: boolean;
  };
  const schedule = migrateScheduleFields(legacy);
  const bookingOpen =
    legacy.status === 'offline'
      ? false
      : (legacy.bookingOpen ?? schedule.bookingOpen);
  const base = normalizeMomentSchedule({
    ...legacy,
    ...schedule,
    bookingOpen,
    fulfilledCount: legacy.fulfilledCount ?? 0,
    slotCapacity: legacy.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
  });
  return {
    ...base,
    kind: '1v1' as const,
    status: legacy.status ?? 'open',
    createdAt: legacy.createdAt ?? Date.now(),
    statusLabel: computeStatusLabel(base, new Date(), getRemainingStock),
  };
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
  return {
    ...item,
    statusLabel: computeStatusLabel(listing, new Date(), getRemainingStock),
  };
}

export function createSupplyMoment(input: CreateMomentInput): OneToOneSupplyListing {
  const existing = snapshot.listings.find(
    (listing): listing is OneToOneSupplyListing =>
      listing.kind === '1v1' && listing.form === input.form,
  );
  const id = existing?.id ?? `m-self-${Date.now()}`;

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
        ? '长期开放的语音专属时刻，按预约时间准时履约。'
        : '长期开放的视频专属时刻，按预约时间准时履约。'),
    durationSec: input.durationSec,
    priceYuan: input.priceYuan,
    bufferMin: input.bufferMin,
    slotIntervalMin: input.slotIntervalMin,
    availFrom: input.availFrom,
    availTo: input.availTo,
    bookableDays: input.bookableDays,
    bookingOpen: input.bookingOpen,
    slotCapacity: existing?.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
    fulfilledCount: existing?.fulfilledCount ?? 0,
    statusLabel: '',
    status: existing?.status ?? 'open',
    createdAt: existing?.createdAt ?? Date.now(),
  };
  listing.statusLabel = computeStatusLabel(listing, new Date(), getRemainingStock);

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
      const next = normalizeListing({
        ...listing,
        ...patch,
        bookingOpen:
          patch.status === 'offline'
            ? false
            : patch.bookingOpen ?? listing.bookingOpen,
      });
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
      bookingOpen: status === 'open' ? listing.bookingOpen : false,
    });
  } else {
    updateCompanionSupply(id, { status });
  }
}

export function recordSupplyResponse(momentId: string, _responseMin: number) {
  snapshot = {
    listings: snapshot.listings.map((listing) => {
      if (listing.id !== momentId || listing.kind !== '1v1') return listing;
      const next = {
        ...listing,
        fulfilledCount: listing.fulfilledCount + 1,
      };
      return {
        ...next,
        statusLabel: computeStatusLabel(next, new Date(), getRemainingStock),
      };
    }),
  };
  emit();
}

type StaticMetric = {
  fulfilledCount: number;
  bookingOpen?: boolean;
};

const staticMetrics: Record<string, StaticMetric> = {};

export function getStaticMetricOverrides(momentId: string) {
  return staticMetrics[momentId];
}

export function recordStaticResponse(
  momentId: string,
  base: { fulfilledCount: number },
  _responseMin: number,
) {
  const current = staticMetrics[momentId] ?? { fulfilledCount: base.fulfilledCount };
  staticMetrics[momentId] = {
    ...current,
    fulfilledCount: current.fulfilledCount + 1,
  };
  emit();
}

export function setStaticBookingOpen(
  momentId: string,
  bookingOpen: boolean,
  base: { fulfilledCount: number },
) {
  const current = staticMetrics[momentId] ?? { fulfilledCount: base.fulfilledCount };
  staticMetrics[momentId] = { ...current, bookingOpen };
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
