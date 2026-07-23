import { useSyncExternalStore } from 'react';
import { GROUP_WEREWOLF_DEMO_PRESET } from '../data/groupDemoPresets';
import type { SkuType } from '../data/mock';
import type {
  GroupContentSection,
  GroupRefundPolicy,
} from '../data/marketMock';
import type {
  CompanionSupplyListing,
  GroupSupplyListing,
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
  intro: string;
  hostIntro: string;
  hostWechatId: string;
  joinNoteTemplate: string;
  hostBadge: string;
  hostOrganizedCount: number;
  coverImageUrl: string;
  refundPolicy: GroupRefundPolicy;
  contentSections: GroupContentSection[];
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
    intro: '',
    hostIntro: '',
    hostWechatId: '',
    joinNoteTemplate: '',
    hostBadge: '',
    hostOrganizedCount: 0,
    coverImageUrl: '',
    refundPolicy: {
      fullRefundHoursBefore: 24,
    },
    contentSections: [],
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
    draft.availFrom = '10:00';
    draft.availTo = '22:00';
  } else if (skuType === 'video') {
    draft.title = '60 秒视频专属时刻';
    draft.description = '和我进行一段专属视频互动。';
    draft.priceYuan = 19.9;
    draft.availFrom = '10:00';
    draft.availTo = '22:00';
  } else if (skuType === 'companion') {
    draft.title = '陪玩 1 小时';
    draft.description = '按约定时间完成陪玩服务，完成后双方确认交割。';
    draft.priceYuan = 39;
    draft.bookingOpen = false;
  } else if (skuType === 'group') {
    const preset = GROUP_WEREWOLF_DEMO_PRESET;
    draft.title = preset.title;
    draft.description = preset.description;
    draft.intro = preset.intro;
    draft.serviceTime = preset.whenLabel;
    draft.placeLabel = preset.placeLabel;
    draft.priceYuan = preset.priceYuan;
    draft.seats = preset.seats;
    draft.coverImageUrl = preset.coverImageUrl;
    draft.hostBadge = preset.hostBadge;
    draft.hostOrganizedCount = preset.hostOrganizedCount;
    draft.hostIntro = preset.hostIntro;
    draft.hostWechatId = preset.hostWechatId;
    draft.joinNoteTemplate = preset.joinNoteTemplate;
    draft.refundPolicy = preset.refundPolicy;
    draft.contentSections = preset.contentSections;
    draft.bookingOpen = false;
  }
}

export function loadListingIntoDraft(
  listing: OneToOneSupplyListing | CompanionSupplyListing | GroupSupplyListing,
) {
  if (listing.kind === 'group') {
    draft = {
      ...createEmptyDraft(),
      editingId: listing.id,
      skuType: 'group',
      title: listing.title,
      description: listing.description,
      intro: listing.intro,
      serviceTime: listing.whenLabel,
      placeLabel: listing.placeLabel,
      priceYuan: listing.priceYuan,
      seats: listing.seats,
      coverImageUrl: listing.coverImageUrl,
      hostBadge: listing.hostBadge,
      hostOrganizedCount: listing.hostOrganizedCount,
      hostIntro: listing.hostIntro,
      hostWechatId: listing.hostWechatId,
      joinNoteTemplate: listing.joinNoteTemplate,
      refundPolicy: listing.refundPolicy,
      contentSections: listing.contentSections,
      bookingOpen: false,
    };
  } else if (listing.kind === '1v1') {
    draft = {
      ...createEmptyDraft(),
      editingId: listing.id,
      skuType: listing.form,
      title: listing.title,
      description: listing.description,
      priceYuan: listing.priceYuan,
      durationSec: listing.durationSec,
      bookingOpen: listing.bookingOpen,
      availFrom: listing.availFrom,
      availTo: listing.availTo,
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
  if (current.skuType === 'companion' || current.skuType === 'group') {
    return null;
  }
  if (!current.availFrom.trim() || !current.availTo.trim()) {
    return '请完整填写营业时间';
  }
  return null;
}

export function draftScheduleConfig(current = draft) {
  return {
    bookingOpen: current.bookingOpen,
    availFrom: current.availFrom,
    availTo: current.availTo,
  };
}

export function draftToGroupCreateInput(current = draft) {
  return {
    title: current.title,
    description: current.description,
    intro: current.intro,
    whenLabel: current.serviceTime,
    placeLabel: current.placeLabel,
    priceYuan: current.priceYuan,
    seats: current.seats,
    coverImageUrl: current.coverImageUrl,
    hostBadge: current.hostBadge,
    hostOrganizedCount: current.hostOrganizedCount,
    hostIntro: current.hostIntro,
    hostWechatId: current.hostWechatId,
    joinNoteTemplate: current.joinNoteTemplate,
    refundPolicy: current.refundPolicy,
    contentSections: current.contentSections,
  };
}
