export type InteractionForm = 'voice' | 'video';
export type SkuType = InteractionForm | 'companion';

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
  verified: boolean;
  bio: string;
};

export type MomentItem = {
  id: string;
  title: string;
  providerId: string;
  form: InteractionForm;
  sceneTag: string;
  description: string;
  durationSec: number;
  priceYuan: number;
  statusLabel: string;
  slots: Slot[];
  /** 是否接受「尽快」订单（能力） */
  asapEnabled: boolean;
  /** 是否暂停接单（临时）；不影响预约档期 */
  acceptingPaused: boolean;
  fulfilledCount: number;
  avgResponseMin: number;
};

export type CategoryKey = '1v1' | 'group' | 'transfer';

export const categories: { key: CategoryKey; label: string; hint: string }[] = [
  { key: '1v1', label: '1V1', hint: '平台履约 · 尽快 / 预约' },
  { key: 'group', label: '组局 / 陪玩', hint: '线下履约 · 双方确认交割' },
  { key: 'transfer', label: '转约', hint: '规则占位，首期不开放交易' },
];

/** 首页分类 pill（含「全部」） */
export const marketFilters: { key: 'all' | CategoryKey; label: string }[] = [
  { key: 'all', label: '全部' },
  ...categories.map((c) => ({ key: c.key, label: c.label })),
];

export const SELF_PROVIDER_ID = 'p-self';
export const ASAP_SLOT_ID = 'asap';

export const providers: Provider[] = [
  {
    id: 'p-aurora',
    name: 'Aurora',
    avatarColor: '#3DB8A0',
    verified: true,
    bio: '专注短时语音互动，准时履约。',
  },
  {
    id: 'p-nova',
    name: 'Nova',
    avatarColor: '#4A7FD4',
    verified: true,
    bio: '短视频专属互动，档期清晰可约。',
  },
  {
    id: SELF_PROVIDER_ID,
    name: '玛薯 7729',
    avatarColor: '#4ADCC4',
    verified: true,
    bio: '在 MAXU 记录生活，也开放自己的专属时刻。',
  },
];

/** 当前是否在接 ASAP（派生，供给内部用） */
export function isAcceptingNow(m: Pick<MomentItem, 'asapEnabled' | 'acceptingPaused'>): boolean {
  return m.asapEnabled && !m.acceptingPaused;
}

/** 买家视角的可约性：尽快 / 最早档期 / 已约满 */
export type BuyerAvailability =
  | { kind: 'now'; waitMin: number }
  | { kind: 'slot'; earliestLabel: string }
  | { kind: 'full' };

export function buyerAvailability(
  m: Pick<MomentItem, 'asapEnabled' | 'acceptingPaused' | 'slots' | 'avgResponseMin'>,
): BuyerAvailability {
  if (isAcceptingNow(m)) {
    return { kind: 'now', waitMin: Math.max(1, m.avgResponseMin || 5) };
  }
  const first = m.slots.find((s) => s.remaining > 0);
  if (first) return { kind: 'slot', earliestLabel: first.label };
  return { kind: 'full' };
}

/** 买家语言的状态标签，全站不出现「暂停」等供给术语 */
export function computeStatusLabel(
  m: Pick<MomentItem, 'asapEnabled' | 'acceptingPaused' | 'slots' | 'avgResponseMin'>,
): string {
  const a = buyerAvailability(m);
  if (a.kind === 'now') return `尽快·平均响应时长${a.waitMin}分钟`;
  if (a.kind === 'slot') return `最早 ${a.earliestLabel}`;
  return '已约满';
}

export const moments: MomentItem[] = [
  {
    id: 'm-voice-60',
    title: '60 秒语音专属时刻',
    providerId: 'p-aurora',
    form: 'voice',
    sceneTag: '语音互动',
    description: '长期开放的语音专属时刻，支持尽快接单或预约档期。',
    durationSec: 60,
    priceYuan: 9.9,
    statusLabel: '尽快·平均响应时长4分钟',
    asapEnabled: true,
    acceptingPaused: false,
    fulfilledCount: 128,
    avgResponseMin: 4,
    slots: [
      { id: 'sv-1', label: '今天 20:00', startAt: 'today-20:00', remaining: 5 },
      { id: 'sv-2', label: '今天 21:00', startAt: 'today-21:00', remaining: 3 },
      { id: 'sv-3', label: '明天 19:30', startAt: 'tomorrow-19:30', remaining: 8 },
    ],
  },
  {
    id: 'm-video-60',
    title: '60 秒视频专属时刻',
    providerId: 'p-nova',
    form: 'video',
    sceneTag: '视频互动',
    description: '长期开放的视频专属时刻，档期清晰，也可尽快接单。',
    durationSec: 60,
    priceYuan: 19.9,
    statusLabel: '最早 今天 20:30',
    asapEnabled: true,
    acceptingPaused: true,
    fulfilledCount: 86,
    avgResponseMin: 12,
    slots: [
      { id: 'vd-1', label: '今天 20:30', startAt: 'today-20:30', remaining: 4 },
      { id: 'vd-2', label: '今天 22:00', startAt: 'today-22:00', remaining: 2 },
      { id: 'vd-3', label: '明天 20:00', startAt: 'tomorrow-20:00', remaining: 6 },
    ],
  },
];

export function getProvider(id: string) {
  return providers.find((p) => p.id === id);
}

export function getMoment(id: string) {
  return moments.find((m) => m.id === id);
}

export function getSlot(momentId: string, slotId: string) {
  const moment = getMoment(momentId);
  return moment?.slots.find((s) => s.id === slotId);
}
