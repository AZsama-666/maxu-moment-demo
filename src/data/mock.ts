import type { ScheduleConfig } from '../utils/bookingSlots';
import {
  formatEarliestCapsule,
  getEarliestBookable,
  migrateScheduleFields,
  type BookableSlot,
} from '../utils/bookingSlots';

export type InteractionForm = 'voice' | 'video';
export type SkuType = InteractionForm | 'companion';

/** @deprecated 运行时由 bookingSlots 生成，仅保留类型兼容 */
export type Slot = {
  id: string;
  label: string;
  startAt: string;
  remaining: number;
};

export type Provider = {
  id: string;
  name: string;
  avatarColor: string;
  /** 市集列表小头像 */
  avatarUrl?: string;
  /** 点进 TA / 详情页的大头像；无则回退 avatarUrl */
  coverUrl?: string;
  verified: boolean;
  bio: string;
};

export type MomentItem = ScheduleConfig & {
  id: string;
  title: string;
  providerId: string;
  form: InteractionForm;
  sceneTag: string;
  description: string;
  durationSec: number;
  priceYuan: number;
  statusLabel: string;
  fulfilledCount: number;
  /** @deprecated 不再用于买家展示 */
  avgResponseMin?: number;
  /** @deprecated 使用 bookingOpen */
  asapEnabled?: boolean;
  /** @deprecated 使用 bookingOpen */
  acceptingPaused?: boolean;
  /** @deprecated 使用 bookingSlots 引擎 */
  slots?: Slot[];
};

export type CategoryKey = '1v1' | 'group' | 'transfer';

export const categories: { key: CategoryKey; label: string; hint: string }[] = [
  { key: '1v1', label: '1V1', hint: '平台履约 · 预约时间' },
  { key: 'group', label: '组局 / 陪玩', hint: '线下履约 · 双方确认交割' },
  { key: 'transfer', label: '转约', hint: '规则占位，首期不开放交易' },
];

/** 首页分类 pill（含「全部」） */
export const marketFilters: { key: 'all' | CategoryKey; label: string }[] = [
  { key: 'all', label: '全部' },
  ...categories.map((c) => ({ key: c.key, label: c.label })),
];

export const SELF_PROVIDER_ID = 'p-self';

export const providers: Provider[] = [
  {
    id: 'p-aurora',
    name: 'Aurora',
    avatarColor: '#3DB8A0',
    avatarUrl: '/avatars/aurora.png',
    coverUrl: '/avatars/aurora-cover.png',
    verified: true,
    bio: '语音与视频专属时刻都开放，准时履约。',
  },
  {
    id: 'p-nova',
    name: 'Nova',
    avatarColor: '#4A7FD4',
    avatarUrl: '/avatars/nova.png',
    coverUrl: '/avatars/nova-cover.png',
    verified: true,
    bio: '短视频专属互动，档期清晰可约。',
  },
  {
    id: 'p-azhe',
    name: '阿哲',
    avatarColor: '#E8A05A',
    avatarUrl: '/avatars/azhe.png',
    verified: true,
    bio: '线下组局组织者，到场双方确认交割。',
  },
  {
    id: 'p-kira',
    name: 'Kira',
    avatarColor: '#7B6CF6',
    avatarUrl: '/avatars/kira.png',
    coverUrl: '/avatars/kira-cover.png',
    verified: true,
    bio: '陪玩上分，结束后双方确认交割。',
  },
  {
    id: SELF_PROVIDER_ID,
    name: '玛薯',
    avatarColor: '#4ADCC4',
    verified: true,
    bio: '在 MAXU 记录生活，也开放自己的专属时刻。',
  },
];

/** 点进去用的大图：优先 cover，否则列表头像 */
export function providerHeroUrl(
  provider: Pick<Provider, 'coverUrl' | 'avatarUrl'>,
): string | undefined {
  return provider.coverUrl || provider.avatarUrl;
}

export function normalizeMomentSchedule(m: MomentItem): MomentItem {
  const schedule = migrateScheduleFields(m);
  return { ...m, ...schedule };
}

/** 买家视角的可约性 */
export type BuyerAvailability =
  | { kind: 'available'; earliestAt: Date; earliestLabel: string }
  | { kind: 'full' };

export function buyerAvailability(
  m: MomentItem,
  now = new Date(),
  getRemaining?: (momentId: string, slotId: string) => number,
): BuyerAvailability {
  const config = migrateScheduleFields(m);
  if (!config.bookingOpen) return { kind: 'full' };
  const earliest = getEarliestBookable(m.id, config, now, getRemaining);
  if (!earliest) return { kind: 'full' };
  return {
    kind: 'available',
    earliestAt: new Date(earliest.startMs),
    earliestLabel: formatEarliestCapsule(new Date(earliest.startMs), now),
  };
}

export function computeStatusLabel(
  m: MomentItem,
  now = new Date(),
  getRemaining?: (momentId: string, slotId: string) => number,
): string {
  const a = buyerAvailability(m, now, getRemaining);
  if (a.kind === 'available') return `最早 ${a.earliestLabel} 可约`;
  return '已约满';
}

export const moments: MomentItem[] = [
  {
    id: 'm-voice-60',
    title: '60 秒语音专属时刻',
    providerId: 'p-aurora',
    form: 'voice',
    sceneTag: '语音互动',
    description: '长期开放的语音专属时刻，按预约时间准时履约。',
    durationSec: 60,
    priceYuan: 9.9,
    statusLabel: '',
    fulfilledCount: 128,
    availFrom: '10:00',
    availTo: '02:00',
    bookingOpen: true,
    slotCapacity: 5,
  },
  {
    id: 'm-aurora-video-60',
    title: '60 秒视频专属时刻',
    providerId: 'p-aurora',
    form: 'video',
    sceneTag: '视频互动',
    description: 'Aurora 的视频专属时刻，按预约时间准时履约。',
    durationSec: 60,
    priceYuan: 19.9,
    statusLabel: '',
    fulfilledCount: 64,
    availFrom: '10:00',
    availTo: '02:00',
    bookingOpen: true,
    slotCapacity: 5,
  },
  {
    id: 'm-video-60',
    title: '60 秒视频专属时刻',
    providerId: 'p-nova',
    form: 'video',
    sceneTag: '视频互动',
    description: '长期开放的视频专属时刻，按预约时间准时履约。',
    durationSec: 60,
    priceYuan: 19.9,
    statusLabel: '',
    fulfilledCount: 86,
    availFrom: '10:00',
    availTo: '22:00',
    bookingOpen: true,
    slotCapacity: 4,
  },
].map((m) => ({
  ...m,
  statusLabel: computeStatusLabel(m as MomentItem),
})) as MomentItem[];

export function getProvider(id: string) {
  return providers.find((p) => p.id === id);
}

export function getMoment(id: string) {
  return moments.find((m) => m.id === id);
}

export type { BookableSlot, ScheduleConfig };