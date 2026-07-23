import { useSyncExternalStore } from 'react';
import { GROUP_SELF_LISTING_ID } from '../data/groupDemoPresets';
import {
  SELF_PROVIDER_ID,
  computeStatusLabel,
  normalizeMomentSchedule,
  type InteractionForm,
  type MomentItem,
  type SkuType,
} from '../data/mock';
import type {
  GroupContentSection,
  GroupRefundPolicy,
} from '../data/marketMock';
import { BOOKABLE_DAYS, DEFAULT_SLOT_CAPACITY, migrateScheduleFields } from '../utils/bookingSlots';
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

export type GroupSupplyListing = {
  kind: 'group';
  id: string;
  skuType: 'group';
  title: string;
  providerId: string;
  description: string;
  intro: string;
  whenLabel: string;
  placeLabel: string;
  priceYuan: number;
  seats: number;
  seatsLeft: number;
  coverImageUrl: string;
  hostBadge: string;
  hostOrganizedCount: number;
  hostIntro: string;
  hostWechatId: string;
  joinNoteTemplate: string;
  refundPolicy: GroupRefundPolicy;
  contentSections: GroupContentSection[];
  status: SupplyStatus;
  createdAt: number;
};

export type SupplyListing =
  | OneToOneSupplyListing
  | CompanionSupplyListing
  | GroupSupplyListing;

export type CreateMomentInput = {
  form: InteractionForm;
  title: string;
  description?: string;
  durationSec: number;
  priceYuan: number;
  availFrom: string;
  availTo: string;
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

export type CreateGroupInput = {
  title: string;
  description: string;
  intro: string;
  whenLabel: string;
  placeLabel: string;
  priceYuan: number;
  seats: number;
  coverImageUrl: string;
  hostBadge: string;
  hostOrganizedCount: number;
  hostIntro: string;
  hostWechatId: string;
  joinNoteTemplate: string;
  refundPolicy: GroupRefundPolicy;
  contentSections: GroupContentSection[];
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
  listing: SupplyListing & { online?: boolean; kind?: '1v1' | 'companion' | 'group' },
): SupplyListing {
  if (listing.kind === 'group') {
    return {
      ...listing,
      skuType: 'group',
      seatsLeft: listing.seatsLeft ?? listing.seats ?? 8,
      status: listing.status ?? 'open',
    };
  }

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
    availFrom: input.availFrom,
    availTo: input.availTo,
    bookableDays: BOOKABLE_DAYS,
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

export function createGroupSupply(input: CreateGroupInput): GroupSupplyListing {
  const existing = snapshot.listings.find(
    (listing): listing is GroupSupplyListing => listing.kind === 'group',
  );
  const sold = existing ? Math.max(0, existing.seats - existing.seatsLeft) : 0;
  const seats = input.seats;

  const listing: GroupSupplyListing = {
    kind: 'group',
    skuType: 'group',
    id: GROUP_SELF_LISTING_ID,
    title: input.title.trim(),
    providerId: SELF_PROVIDER_ID,
    description: input.description.trim(),
    intro: input.intro.trim(),
    whenLabel: input.whenLabel.trim(),
    placeLabel: input.placeLabel.trim(),
    priceYuan: input.priceYuan,
    seats,
    seatsLeft: Math.max(0, seats - sold),
    coverImageUrl: input.coverImageUrl,
    hostBadge: input.hostBadge,
    hostOrganizedCount: input.hostOrganizedCount,
    hostIntro: input.hostIntro.trim(),
    hostWechatId: input.hostWechatId.trim(),
    joinNoteTemplate: input.joinNoteTemplate.trim(),
    refundPolicy: input.refundPolicy,
    contentSections: input.contentSections,
    status: existing?.status ?? 'open',
    createdAt: existing?.createdAt ?? Date.now(),
  };

  snapshot = {
    listings: existing
      ? snapshot.listings.map((item) =>
          item.kind === 'group' ? listing : item,
        )
      : [listing, ...snapshot.listings],
  };
  emit();
  return listing;
}

export function updateGroupSupply(
  id: string,
  patch: Partial<Omit<GroupSupplyListing, 'id' | 'kind' | 'skuType' | 'createdAt'>>,
) {
  snapshot = {
    listings: snapshot.listings.map((listing) => {
      if (listing.id !== id || listing.kind !== 'group') return listing;
      const next = { ...listing, ...patch };
      if (patch.seats != null && patch.seatsLeft == null) {
        const sold = Math.max(0, listing.seats - listing.seatsLeft);
        next.seatsLeft = Math.max(0, patch.seats - sold);
      }
      return next;
    }),
  };
  emit();
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
  } else if (listing.kind === 'group') {
    updateGroupSupply(id, { status });
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
  if (skuType === 'group') {
    return snapshot.listings.find(
      (listing): listing is GroupSupplyListing => listing.kind === 'group',
    );
  }
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

export function getOpenGroupListings(): GroupSupplyListing[] {
  return snapshot.listings.filter(
    (listing): listing is GroupSupplyListing =>
      listing.kind === 'group' && listing.status === 'open',
  );
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
