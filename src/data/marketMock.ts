import { getProvider, listBrowseMoments } from './catalog';
import {
  SELF_PROVIDER_ID,
  buyerAvailability,
  type CategoryKey,
  type MomentItem,
} from './mock';
import { WITHIN_15_MIN_MS, getBookingStatus, migrateScheduleFields } from '../utils/bookingSlots';
import { getRemainingStock } from '../state/orderStore';
import { getOpenCompanionListings, getOpenGroupListings } from '../state/supplyStore';

export type MarketFilter = 'all' | CategoryKey;

export type GroupContentSection = {
  title: string;
  body: string;
};

export type GroupRefundPolicy = {
  fullRefundHoursBefore: number;
  partialRefundHoursBefore?: number;
  partialRefundPenaltyPercent?: number;
  noShowNote?: string;
};

export function formatRefundPolicySummary(policy: GroupRefundPolicy): string {
  const parts: string[] = [
    `活动开始前 ${policy.fullRefundHoursBefore} 小时可免费取消`,
  ];
  if (
    policy.partialRefundHoursBefore != null &&
    policy.partialRefundPenaltyPercent != null
  ) {
    parts.push(
      `${policy.partialRefundHoursBefore} 小时内取消扣 ${policy.partialRefundPenaltyPercent}%`,
    );
  }
  parts.push(policy.noShowNote ?? '活动当日未到不予退款');
  return `${parts.join('；')}。`;
}

const GROUP_SEATS_STORAGE_KEY = 'maxu-moment-demo-group-seats-v1';

type GroupSeatOverride = {
  seatsLeft: number;
  joinedCount: number;
};

function loadGroupSeatOverrides(): Record<string, GroupSeatOverride> {
  try {
    const raw = localStorage.getItem(GROUP_SEATS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, GroupSeatOverride>) : {};
  } catch {
    return {};
  }
}

function saveGroupSeatOverrides(overrides: Record<string, GroupSeatOverride>) {
  localStorage.setItem(GROUP_SEATS_STORAGE_KEY, JSON.stringify(overrides));
}

function applyGroupSeatOverride(listing: GroupListing): GroupListing {
  const override = loadGroupSeatOverrides()[listing.id];
  if (!override) return listing;
  return {
    ...listing,
    seatsLeft: override.seatsLeft,
    joinedCount: override.joinedCount,
  };
}

export function deductGroupSeatOnPay(listingId: string): boolean {
  const base = getGroupListing(listingId);
  if (!base) return false;
  const overrides = loadGroupSeatOverrides();
  const current = overrides[listingId] ?? {
    seatsLeft: base.seatsLeft,
    joinedCount: base.joinedCount,
  };
  if (current.seatsLeft <= 0) return false;
  overrides[listingId] = {
    seatsLeft: current.seatsLeft - 1,
    joinedCount: current.joinedCount + 1,
  };
  saveGroupSeatOverrides(overrides);
  return true;
}

/** 组局：主理人召集多人参与的活动 */
export type GroupListing = {
  kind: 'group';
  id: string;
  hostProviderId: string;
  title: string;
  hostName: string;
  avatarColor: string;
  avatarUrl?: string;
  /** 活动封面（与人像头像区分） */
  coverImageUrl?: string;
  whenLabel: string;
  placeLabel: string;
  /** 距离展示，如「3.2km」 */
  distanceLabel?: string;
  priceYuan: number;
  seatsLeft: number;
  joinedCount: number;
  /** 参与人头像（卡片底部叠层展示，最多展示前 3 个） */
  participantAvatars?: string[];
  /** 主理人标识，如俱乐部/认证标签 */
  hostBadge?: string;
  /** 列表卡短摘要 */
  description: string;
  /** 详情页活动简介 */
  intro?: string;
  /** 详情页活动内容（流程 / 注意事项 / 退改政策等） */
  contentSections?: GroupContentSection[];
  /** 主理人已成功组织场次 */
  hostOrganizedCount?: number;
  /** 主理人详情页专用简介 */
  hostIntro?: string;
  /** 结构化退改规则（摘要展示） */
  refundPolicy?: GroupRefundPolicy;
  /** 主理人微信（仅付款后在订单页展示） */
  hostWechatId?: string;
  /** 加微信备注模板 */
  joinNoteTemplate?: string;
};

/** 陪玩：本质 1V1，双方确认交割（非组局 feed） */
export type CompanionListing = {
  kind: 'companion';
  id: string;
  supplyListingId?: string;
  providerId: string;
  title: string;
  providerName: string;
  avatarColor: string;
  avatarUrl?: string;
  whenLabel: string;
  placeLabel: string;
  priceYuan: number;
  remaining: number;
  description: string;
};

export type DualConfirmListing = GroupListing | CompanionListing;

export const GROUP_TRUST_HINT =
  '线下履约 · 到场后双方在 App 内确认交割';

export const COMPANION_TRUST_HINT =
  '1V1 陪玩 · 服务完成后双方确认交割';

export function isOnlineGroupPlace(placeLabel: string): boolean {
  return placeLabel.includes('线上');
}

/** 市集主卡片：按人聚合，SKU 在 TA 页选择 */
export type PersonListing = {
  kind: 'person';
  providerId: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  verified: boolean;
  bio: string;
  offerTags: string[];
  earliestAt?: number;
  earliestLabel?: string;
  inBusiness: boolean;
  within15Min: boolean;
  fromPriceYuan: number;
  has1v1: boolean;
  hasCompanion: boolean;
  hasGroup: boolean;
};

export type MarketItem = PersonListing;

export type HomeFeedItem =
  | { kind: 'person'; person: PersonListing }
  | { kind: 'group'; group: GroupListing };

export const groupListings: GroupListing[] = [
  {
    kind: 'group',
    id: 'g-boardgame',
    hostProviderId: 'p-azhe',
    title: '周末桌游局 · 狼人杀',
    hostName: '阿哲',
    avatarColor: '#E8A05A',
    avatarUrl: '/avatars/azhe.png',
    coverImageUrl: '/covers/g-boardgame-cover.png',
    whenLabel: '周六 19:30',
    placeLabel: '静安 · 桌游吧',
    distanceLabel: '3.2km',
    priceYuan: 68,
    seatsLeft: 3,
    joinedCount: 2,
    participantAvatars: ['/avatars/nova.png', '/avatars/kira.png'],
    hostBadge: '组局主理人',
    description:
      '线下组局，到场后双方在 App 内确认收货交割。平台不代履约通话，仅协助撮合与确认。',
    intro:
      '周末放松的小型狼人杀局，新手友好、规则会现场讲解。6–8 人小局，氛围轻松不尬聊，适合想认识同城桌游爱好者的你。',
    contentSections: [
      {
        title: '活动流程',
        body: '19:30 集合签到\n20:00 规则讲解与分组\n20:15–22:00 狼人杀 2–3 局\n22:00 后自由交流，可提前离场',
      },
      {
        title: '费用说明',
        body: '¥68 含桌游吧场地费与基础饮品（可乐/茶水）。不含晚餐，可自带小零食与他人分享。',
      },
      {
        title: '注意事项',
        body: '请准时到场，迟到超过 30 分钟可能无法加入当局。\n文明游戏，禁止贴脸、场外沟通或恶意剧透。\n尊重不同水平玩家，新手局以体验为先。',
      },
      {
        title: '退改政策',
        body: '活动开始前 24 小时取消，全额退款。\n24 小时内取消，扣除 50% 作为场地占位费。\n当日未到视为放弃，不予退款。',
      },
    ],
    hostOrganizedCount: 12,
    hostIntro:
      '上海桌游爱好者，专注组织 6–10 人小型熟人局。已成功举办 12 场线下活动，氛围轻松、规则清晰，欢迎新手加入。',
    refundPolicy: {
      fullRefundHoursBefore: 24,
      partialRefundHoursBefore: 24,
      partialRefundPenaltyPercent: 50,
      noShowNote: '当日未到视为放弃，不予退款',
    },
    hostWechatId: 'azhe_boardgame',
    joinNoteTemplate: '昵称+手机号',
  },
  {
    kind: 'group',
    id: 'g-coffee',
    hostProviderId: 'p-aurora',
    title: '周日咖啡局 · 轻社交聊天',
    hostName: 'Aurora',
    avatarColor: '#3DB8A0',
    avatarUrl: '/avatars/aurora.png',
    coverImageUrl: '/covers/g-coffee-cover.png',
    whenLabel: '周日 15:00',
    placeLabel: '徐汇 · 武康路',
    distanceLabel: '5.8km',
    priceYuan: 48,
    seatsLeft: 2,
    joinedCount: 4,
    participantAvatars: [
      '/avatars/nova.png',
      '/avatars/azhe.png',
      '/avatars/kira.png',
    ],
    hostBadge: '已认证主理',
    description:
      '小型线下社交局，限 6 人。到场后双方在 App 内确认交割。',
    intro:
      '武康路午后咖啡轻社交，限 6 人小局。无推销、无 KPI 式社交，就是找几个聊得来的人一起喝杯好咖啡。',
    contentSections: [
      {
        title: '活动安排',
        body: '15:00 咖啡店集合（会发具体店名与座位区）\n15:15–16:30 自由聊天 + 主题破冰（每周不同话题）\n16:30 合影告别，可自行续摊',
      },
      {
        title: '适合谁',
        body: '想拓展同城社交圈、又不喜欢大型联谊活动的年轻人。\n接受 1v1 浅聊，也欢迎安静听别人讲故事。\n年龄建议 22–35，不限职业。',
      },
      {
        title: '费用含什么',
        body: '¥48 含一杯指定手冲或拿铁（到店自选）。\n不含额外点单，如需加餐请自行买单。',
      },
      {
        title: '退改说明',
        body: '活动开始前 12 小时取消，全额退款。\n12 小时内取消，扣除 30% 占位费。\n当日未到视为放弃，不予退款。',
      },
    ],
    hostOrganizedCount: 8,
    hostIntro:
      '线下轻社交发起人，擅长控场与破冰。已组织 8 场咖啡局，参与者反馈「不尬、能聊、会再来」。',
    refundPolicy: {
      fullRefundHoursBefore: 12,
      partialRefundHoursBefore: 12,
      partialRefundPenaltyPercent: 30,
      noShowNote: '当日未到视为放弃，不予退款',
    },
  },
];

export const companionListings: CompanionListing[] = [
  {
    kind: 'companion',
    id: 'c-valorant-kira',
    providerId: 'p-kira',
    title: '瓦罗兰特上分陪玩',
    providerName: 'Kira',
    avatarColor: '#7B6CF6',
    avatarUrl: '/avatars/kira.png',
    whenLabel: '今晚可约',
    placeLabel: '线上开黑',
    priceYuan: 39,
    remaining: 5,
    description:
      '陪玩结束后双方确认完成交割。本 Demo 模拟远程陪玩与确认流程，不产生真实游戏服务。',
  },
];

function dynamicCompanionListings(): CompanionListing[] {
  return getOpenCompanionListings().map((listing) => ({
    kind: 'companion' as const,
    id: listing.id,
    supplyListingId: listing.id,
    providerId: SELF_PROVIDER_ID,
    title: listing.title,
    providerName: '玛薯',
    avatarColor: '#4ADCC4',
    whenLabel: listing.serviceTime,
    placeLabel: listing.placeLabel,
    priceYuan: listing.priceYuan,
    remaining: listing.remaining,
    description: listing.description,
  }));
}

function dynamicGroupListings(): GroupListing[] {
  return getOpenGroupListings().map((listing) => ({
    kind: 'group' as const,
    id: listing.id,
    hostProviderId: listing.providerId,
    title: listing.title,
    hostName: '玛薯',
    avatarColor: '#4ADCC4',
    coverImageUrl: listing.coverImageUrl,
    whenLabel: listing.whenLabel,
    placeLabel: listing.placeLabel,
    distanceLabel: '3.2km',
    priceYuan: listing.priceYuan,
    seatsLeft: listing.seatsLeft,
    joinedCount: Math.max(0, listing.seats - listing.seatsLeft),
    hostBadge: listing.hostBadge,
    description: listing.description,
    intro: listing.intro,
    contentSections: listing.contentSections,
    hostOrganizedCount: listing.hostOrganizedCount,
    hostIntro: listing.hostIntro,
    refundPolicy: listing.refundPolicy,
    hostWechatId: listing.hostWechatId,
    joinNoteTemplate: listing.joinNoteTemplate,
  }));
}

export function listAllGroupListings(): GroupListing[] {
  const staticListings = groupListings.map(applyGroupSeatOverride);
  const dynamic = dynamicGroupListings().map(applyGroupSeatOverride);
  const dynamicIds = new Set(dynamic.map((g) => g.id));
  return [
    ...staticListings.filter((g) => !dynamicIds.has(g.id)),
    ...dynamic,
  ];
}

export function listAllCompanionListings(): CompanionListing[] {
  return [...companionListings, ...dynamicCompanionListings()];
}

/** 买家浏览用组局列表：Demo 仅展示自发 listing，隐藏静态 mock */
export function listBrowseGroupListings(): GroupListing[] {
  return dynamicGroupListings().map(applyGroupSeatOverride);
}

/** 买家浏览用陪玩列表（不含自己的 SKU） */
export function listBrowseCompanionListings(): CompanionListing[] {
  return listAllCompanionListings().filter(
    (c) => c.providerId !== SELF_PROVIDER_ID,
  );
}

export function getGroupListing(id: string) {
  return listAllGroupListings().find((g) => g.id === id);
}

export function getCompanionListing(id: string) {
  return listAllCompanionListings().find((c) => c.id === id);
}

export function getDualConfirmListing(id: string): DualConfirmListing | undefined {
  return getGroupListing(id) ?? getCompanionListing(id);
}

export function listGroupsByProvider(providerId: string): GroupListing[] {
  return listAllGroupListings().filter((g) => g.hostProviderId === providerId);
}

export function listCompanionsByProvider(providerId: string): CompanionListing[] {
  return listAllCompanionListings().filter((c) => c.providerId === providerId);
}

function buildPersonListing(
  providerId: string,
  moments: MomentItem[],
  groups: GroupListing[],
  companions: CompanionListing[],
): PersonListing | null {
  const provider = getProvider(providerId);
  if (!provider) return null;
  if (moments.length === 0 && groups.length === 0 && companions.length === 0) {
    return null;
  }

  const offerTags: string[] = [];
  if (moments.some((m) => m.form === 'voice')) offerTags.push('语音');
  if (moments.some((m) => m.form === 'video')) offerTags.push('视频');
  if (companions.length > 0) offerTags.push('陪玩');
  if (groups.length > 0) offerTags.push('组局');

  const now = Date.now();
  const nowDate = new Date(now);
  let earliestAt: number | undefined;
  let earliestLabel: string | undefined;
  let inBusiness = false;
  for (const m of moments) {
    const config = migrateScheduleFields(m);
    const status = getBookingStatus(m.id, config, nowDate, getRemainingStock);
    if (status.inBusiness) inBusiness = true;
    const av = buyerAvailability(m, nowDate, getRemainingStock);
    if (av.kind === 'available') {
      const ms = av.earliestAt.getTime();
      if (earliestAt === undefined || ms < earliestAt) {
        earliestAt = ms;
        earliestLabel = av.earliestLabel;
      }
    }
  }

  const prices = [
    ...moments.map((m) => m.priceYuan),
    ...groups.map((g) => g.priceYuan),
    ...companions.map((c) => c.priceYuan),
  ];
  const fromPriceYuan = Math.min(...prices);

  return {
    kind: 'person',
    providerId,
    name: provider.name,
    avatarColor: provider.avatarColor,
    avatarUrl: provider.avatarUrl,
    verified: provider.verified,
    bio: provider.bio,
    offerTags,
    earliestAt,
    earliestLabel,
    inBusiness,
    within15Min:
      inBusiness &&
      earliestAt !== undefined &&
      earliestAt - now <= WITHIN_15_MIN_MS,
    fromPriceYuan,
    has1v1: moments.length > 0,
    hasCompanion: companions.length > 0,
    hasGroup: groups.length > 0,
  };
}

export function listMarketItems(): MarketItem[] {
  const moments = listBrowseMoments().filter(
    (m) => m.providerId !== SELF_PROVIDER_ID,
  );
  const groups = listAllGroupListings().filter(
    (g) => g.hostProviderId !== SELF_PROVIDER_ID,
  );
  const companions = listBrowseCompanionListings();
  const ids = new Set<string>();
  for (const m of moments) ids.add(m.providerId);
  for (const g of groups) ids.add(g.hostProviderId);
  for (const c of companions) ids.add(c.providerId);

  const people: PersonListing[] = [];
  for (const id of ids) {
    const person = buildPersonListing(
      id,
      moments.filter((m) => m.providerId === id),
      groups.filter((g) => g.hostProviderId === id),
      companions.filter((c) => c.providerId === id),
    );
    if (person) people.push(person);
  }

  return people;
}

export function filterMarketItems(
  items: MarketItem[],
  category: MarketFilter,
  within15Min: boolean,
): MarketItem[] {
  return items.filter((item) => {
    if (category === '1v1' && !item.has1v1 && !item.hasCompanion) return false;
    if (category === 'group' && !item.hasGroup) return false;
    if (within15Min && !item.within15Min) return false;
    return true;
  });
}

export function sortMarketItems(items: MarketItem[]): MarketItem[] {
  return [...items].sort((a, b) => {
    const rank = (item: MarketItem) => {
      if (item.within15Min) return 0;
      if (item.inBusiness) return 1;
      if (item.earliestAt || item.hasGroup || item.hasCompanion) return 2;
      return 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.earliestAt && b.earliestAt) {
      return a.earliestAt - b.earliestAt;
    }
    return 0;
  });
}

function feedItemRank(item: HomeFeedItem): number {
  if (item.kind === 'person') {
    if (item.person.within15Min) return 0;
    if (item.person.inBusiness) return 1;
    if (item.person.earliestAt || item.person.hasCompanion) return 2;
    return 3;
  }
  return 2;
}

/** 首页列表：全部 Tab 混排人卡 + 组局活动卡；1V1 Tab 仅人卡 */
export function listHomeFeed(
  category: MarketFilter,
  within15Min: boolean,
): HomeFeedItem[] {
  let people = filterMarketItems(listMarketItems(), category, within15Min);

  if (category === 'all') {
    people = people.filter(
      (person) => person.has1v1 || person.hasCompanion || !person.hasGroup,
    );
    const persons: HomeFeedItem[] = sortMarketItems(people).map((person) => ({
      kind: 'person',
      person,
    }));
    const groups: HomeFeedItem[] = listBrowseGroupListings().map((group) => ({
      kind: 'group',
      group,
    }));
    return [...persons, ...groups].sort((a, b) => {
      const ra = feedItemRank(a);
      const rb = feedItemRank(b);
      if (ra !== rb) return ra - rb;
      if (a.kind === 'person' && b.kind === 'person') {
        if (a.person.earliestAt && b.person.earliestAt) {
          return a.person.earliestAt - b.person.earliestAt;
        }
      }
      return 0;
    });
  }

  return sortMarketItems(people).map((person) => ({ kind: 'person', person }));
}
