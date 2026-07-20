import { getProvider, listBrowseMoments } from './catalog';
import {
  buyerAvailability,
  SELF_PROVIDER_ID,
  type CategoryKey,
  type MomentItem,
} from './mock';
import { getOpenCompanionListings } from '../state/supplyStore';

export type MarketFilter = 'all' | CategoryKey;

export type GroupListing = {
  kind: 'group';
  id: string;
  supplyListingId?: string;
  hostProviderId: string;
  title: string;
  hostName: string;
  avatarColor: string;
  avatarUrl?: string;
  sceneTag: string;
  whenLabel: string;
  placeLabel: string;
  priceYuan: number;
  seatsLeft: number;
  description: string;
};

export type TransferListing = {
  kind: 'transfer';
  id: string;
  title: string;
  fromLabel: string;
  ruleHint: string;
  statusLabel: string;
};

/** 市集主卡片：按人聚合，SKU 在 TA 页选择 */
export type PersonListing = {
  kind: 'person';
  providerId: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  verified: boolean;
  bio: string;
  /** 开放能力标签，如 语音 / 视频 / 组局 / 陪玩 */
  offerTags: string[];
  hasAsap: boolean;
  waitMin?: number;
  earliestLabel?: string;
  fromPriceYuan: number;
  has1v1: boolean;
  hasGroup: boolean;
};

export type MarketItem = PersonListing | TransferListing;

export const groupListings: GroupListing[] = [
  {
    kind: 'group',
    id: 'g-boardgame',
    hostProviderId: 'p-azhe',
    title: '周末桌游局 · 狼人杀',
    hostName: '阿哲',
    avatarColor: '#E8A05A',
    avatarUrl: '/avatars/azhe.png',
    sceneTag: '组局',
    whenLabel: '周六 19:30',
    placeLabel: '静安 · 桌游吧',
    priceYuan: 68,
    seatsLeft: 3,
    description:
      '线下组局，到场后双方在 App 内确认收货交割。平台不代履约通话，仅协助撮合与确认。',
  },
  {
    kind: 'group',
    id: 'g-valorant',
    hostProviderId: 'p-kira',
    title: '瓦罗兰特上分陪玩',
    hostName: 'Kira',
    avatarColor: '#7B6CF6',
    avatarUrl: '/avatars/kira.png',
    sceneTag: '陪玩',
    whenLabel: '今晚可约',
    placeLabel: '线上开黑',
    priceYuan: 39,
    seatsLeft: 5,
    description:
      '陪玩结束后双方确认完成交割。本 Demo 模拟线下/远程交割确认，不产生真实游戏服务。',
  },
];

export const transferListings: TransferListing[] = [
  {
    kind: 'transfer',
    id: 't-slot-01',
    title: '转约名额 · 限时开放预告',
    fromLabel: '规则占位',
    ruleHint: '转约规则与交易能力首期未开放，仅展示入口',
    statusLabel: '即将开放',
  },
];

function dynamicCompanionListings(): GroupListing[] {
  return getOpenCompanionListings().map((listing) => ({
    kind: 'group' as const,
    id: listing.id,
    supplyListingId: listing.id,
    hostProviderId: SELF_PROVIDER_ID,
    title: listing.title,
    hostName: '玛薯 7729',
    avatarColor: '#4ADCC4',
    sceneTag: '陪玩',
    whenLabel: listing.serviceTime,
    placeLabel: listing.placeLabel,
    priceYuan: listing.priceYuan,
    seatsLeft: listing.remaining,
    description: listing.description,
  }));
}

export function listAllGroupListings(): GroupListing[] {
  return [...groupListings, ...dynamicCompanionListings()];
}

export function getGroupListing(id: string) {
  return listAllGroupListings().find((g) => g.id === id);
}

export function getTransferListing(id: string) {
  return transferListings.find((t) => t.id === id);
}

export function listGroupsByProvider(providerId: string): GroupListing[] {
  return listAllGroupListings().filter((g) => g.hostProviderId === providerId);
}

function buildPersonListing(
  providerId: string,
  moments: MomentItem[],
  groups: GroupListing[],
): PersonListing | null {
  const provider = getProvider(providerId);
  if (!provider) return null;
  if (moments.length === 0 && groups.length === 0) return null;

  const offerTags: string[] = [];
  if (moments.some((m) => m.form === 'voice')) offerTags.push('语音');
  if (moments.some((m) => m.form === 'video')) offerTags.push('视频');
  for (const g of groups) {
    if (!offerTags.includes(g.sceneTag)) offerTags.push(g.sceneTag);
  }

  let hasAsap = false;
  let waitMin: number | undefined;
  let earliestLabel: string | undefined;
  for (const m of moments) {
    const av = buyerAvailability(m);
    if (av.kind === 'now') {
      hasAsap = true;
      waitMin =
        waitMin === undefined ? av.waitMin : Math.min(waitMin, av.waitMin);
    } else if (av.kind === 'slot' && !earliestLabel) {
      earliestLabel = av.earliestLabel;
    }
  }

  const prices = [
    ...moments.map((m) => m.priceYuan),
    ...groups.map((g) => g.priceYuan),
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
    hasAsap,
    waitMin,
    earliestLabel,
    fromPriceYuan,
    has1v1: moments.length > 0,
    hasGroup: groups.length > 0,
  };
}

/** 市集按人聚合；转约单独占位 */
export function listMarketItems(): MarketItem[] {
  const moments = listBrowseMoments();
  const groups = listAllGroupListings();
  const ids = new Set<string>();
  for (const m of moments) ids.add(m.providerId);
  for (const g of groups) ids.add(g.hostProviderId);

  const people: PersonListing[] = [];
  for (const id of ids) {
    const person = buildPersonListing(
      id,
      moments.filter((m) => m.providerId === id),
      groups.filter((g) => g.hostProviderId === id),
    );
    if (person) people.push(person);
  }

  return [...people, ...transferListings];
}

export function filterMarketItems(
  items: MarketItem[],
  category: MarketFilter,
  onlyNow: boolean,
): MarketItem[] {
  return items.filter((item) => {
    if (item.kind === 'transfer') {
      return category === 'all' || category === 'transfer';
    }
    if (category === '1v1' && !item.has1v1) return false;
    if (category === 'group' && !item.hasGroup) return false;
    if (category === 'transfer') return false;
    if (onlyNow && !item.hasAsap) return false;
    return true;
  });
}

export function sortMarketItems(items: MarketItem[]): MarketItem[] {
  return [...items].sort((a, b) => {
    const rank = (item: MarketItem) => {
      if (item.kind === 'transfer') return 3;
      if (item.hasAsap) return 0;
      if (item.earliestLabel || item.hasGroup) return 1;
      return 2;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.kind === 'person' && b.kind === 'person' && ra === 0) {
      return (a.waitMin ?? 99) - (b.waitMin ?? 99);
    }
    return 0;
  });
}
