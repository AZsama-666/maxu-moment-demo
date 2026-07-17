import { listBrowseMoments } from './catalog';
import type { CategoryKey, MomentItem } from './mock';
import { buyerAvailability } from './mock';

export type MarketFilter = 'all' | CategoryKey;

export type GroupListing = {
  kind: 'group';
  id: string;
  title: string;
  hostName: string;
  avatarColor: string;
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

export type MarketItem =
  | { kind: '1v1'; moment: MomentItem }
  | GroupListing
  | TransferListing;

export const groupListings: GroupListing[] = [
  {
    kind: 'group',
    id: 'g-boardgame',
    title: '周末桌游局 · 狼人杀',
    hostName: '阿哲',
    avatarColor: '#E8A05A',
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
    title: '瓦罗兰特上分陪玩',
    hostName: 'Kira',
    avatarColor: '#7B6CF6',
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

export function getGroupListing(id: string) {
  return groupListings.find((g) => g.id === id);
}

export function getTransferListing(id: string) {
  return transferListings.find((t) => t.id === id);
}

/** 市集混排：1V1 + 组局 + 转约 */
export function listMarketItems(): MarketItem[] {
  const ones: MarketItem[] = listBrowseMoments().map((moment) => ({
    kind: '1v1' as const,
    moment,
  }));
  return [...ones, ...groupListings, ...transferListings];
}

export function filterMarketItems(
  items: MarketItem[],
  category: MarketFilter,
  onlyNow: boolean,
): MarketItem[] {
  return items.filter((item) => {
    if (category !== 'all' && item.kind !== category) return false;
    if (onlyNow) {
      if (item.kind !== '1v1') return false;
      return buyerAvailability(item.moment).kind === 'now';
    }
    return true;
  });
}

export function sortMarketItems(items: MarketItem[]): MarketItem[] {
  return [...items].sort((a, b) => {
    const rank = (item: MarketItem) => {
      if (item.kind === '1v1') {
        const av = buyerAvailability(item.moment);
        if (av.kind === 'now') return 0;
        if (av.kind === 'slot') return 1;
        return 2;
      }
      if (item.kind === 'group') return 1;
      return 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.kind === '1v1' && b.kind === '1v1' && ra === 0) {
      return (a.moment.avgResponseMin || 99) - (b.moment.avgResponseMin || 99);
    }
    return 0;
  });
}
