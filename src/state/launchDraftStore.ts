import { useSyncExternalStore } from 'react';
import type { SkuType } from '../data/mock';
import type {
  CompanionSupplyListing,
  OneToOneSupplyListing,
} from './supplyStore';

export type LaunchDraft = {
  draftId: string;
  editingId?: string;
  skuType?: SkuType;
  title: string;
  description: string;
  priceYuan: number;
  durationSec: number;
  unitLabel: string;
  bookingOpen: boolean;
  bufferMin: number | '';
  slotIntervalMin: number | '';
  availFrom: string;
  availTo: string;
  bookableDays: number | '';
  serviceTime: string;
  placeLabel: string;
  seats: number;
};

const STORAGE_KEY = 'maxu-moment-launch-draft-v2';

function createEmptyDraft(): LaunchDraft {
  return {
    draftId: `draft-${Date.now()}`,
    title: '',
    description: '',
    priceYuan: 0,
    durationSec: 60,
    unitLabel: '1 小时/份',
    bookingOpen: true,
    bufferMin: '',
    slotIntervalMin: '',
    availFrom: '',
    availTo: '',
    bookableDays: '',
    serviceTime: '周六 19:30',
    placeLabel: '线上',
    seats: 5,
  };
}

function load(): LaunchDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...createEmptyDraft(), ...(JSON.parse(raw) as LaunchDraft) };
    }
    const legacy = sessionStorage.getItem('maxu-moment-launch-draft-v1');
    if (legacy) {
      const old = JSON.parse(legacy) as Record<string, unknown>;
      return {
        ...createEmptyDraft(),
        ...(old as Partial<LaunchDraft>),
        bookingOpen: (old.realtimeEnabled as boolean | undefined) ?? true,
        bufferMin: '',
        slotIntervalMin: '',
        availFrom: '',
        availTo: '',
        bookableDays: '',
      };
    }
    return createEmptyDraft();
  } catch {
    return createEmptyDraft();
  }
}

let draft = load();
const listeners = new Set<() => void>();

function emit() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return draft;
}

export function useLaunchDraft() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getLaunchDraft() {
  return draft;
}

export function resetLaunchDraft(skuType?: SkuType) {
  draft = { ...createEmptyDraft(), skuType };
  applySkuDefaults(skuType);
  emit();
}

export function updateLaunchDraft(patch: Partial<LaunchDraft>) {
  draft = { ...draft, ...patch };
  emit();
}

export function selectDraftSku(skuType: SkuType) {
  const changing = draft.skuType !== skuType || Boolean(draft.editingId);
  if (changing) {
    draft = { ...createEmptyDraft(), skuType };
    applySkuDefaults(skuType);
  } else {
    draft = { ...draft, skuType };
  }
  emit();
}

function applySkuDefaults(skuType?: SkuType) {
  if (skuType === 'voice') {
    draft.title = '60 秒语音专属时刻';
    draft.description = '和我进行一段专属语音互动。';
    draft.priceYuan = 9.9;
  } else if (skuType === 'video') {
    draft.title = '60 秒视频专属时刻';
    draft.description = '和我进行一段专属视频互动。';
    draft.priceYuan = 19.9;
  } else if (skuType === 'companion') {
    draft.title = '陪玩 1 小时';
    draft.description = '按约定时间完成陪玩服务，完成后双方确认交割。';
    draft.priceYuan = 39;
    draft.bookingOpen = false;
  }
}

export function loadListingIntoDraft(
  listing: OneToOneSupplyListing | CompanionSupplyListing,
) {
  if (listing.kind === '1v1') {
    draft = {
      ...createEmptyDraft(),
      editingId: listing.id,
      skuType: listing.form,
      title: listing.title,
      description: listing.description,
      priceYuan: listing.priceYuan,
      durationSec: listing.durationSec,
      bookingOpen: listing.bookingOpen,
      bufferMin: listing.bufferMin,
      slotIntervalMin: listing.slotIntervalMin,
      availFrom: listing.availFrom,
      availTo: listing.availTo,
      bookableDays: listing.bookableDays,
    };
  } else {
    draft = {
      ...createEmptyDraft(),
      editingId: listing.id,
      skuType: 'companion',
      title: listing.title,
      description: listing.description,
      priceYuan: listing.priceYuan,
      unitLabel: listing.unitLabel,
      serviceTime: listing.serviceTime,
      placeLabel: listing.placeLabel,
      seats: listing.seats,
      bookingOpen: false,
    };
  }
  emit();
}

export function clearLaunchDraft() {
  draft = createEmptyDraft();
  sessionStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

export function validateScheduleDraft(current = draft): string | null {
  if (current.skuType === 'companion') return null;
  if (
    current.bufferMin === '' ||
    current.slotIntervalMin === '' ||
    current.bookableDays === '' ||
    !current.availFrom.trim() ||
    !current.availTo.trim()
  ) {
    return '请完整填写最早可约缓冲、预约间隔、每日时段和可预约天数';
  }
  if (Number(current.bufferMin) <= 0) return '最早可约缓冲须大于 0';
  if (Number(current.slotIntervalMin) <= 0) return '预约间隔须大于 0';
  if (Number(current.bookableDays) <= 0) return '可预约天数须大于 0';
  if (current.availFrom >= current.availTo) return '结束时间须晚于开始时间';
  return null;
}

export function draftScheduleConfig(current = draft) {
  return {
    bookingOpen: current.bookingOpen,
    bufferMin: Number(current.bufferMin),
    slotIntervalMin: Number(current.slotIntervalMin),
    availFrom: current.availFrom,
    availTo: current.availTo,
    bookableDays: Number(current.bookableDays),
  };
}
