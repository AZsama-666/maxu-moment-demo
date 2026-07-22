import { useSyncExternalStore } from 'react';
import type { GroupListing } from '../data/marketMock';
import type { GroupOrder } from './groupOrderStore';

export type ActivityGroupStatus = 'recruiting' | 'confirmed' | 'ended';

export type ActivityGroup = {
  id: string;
  listingId: string;
  orderIds: string[];
  name: string;
  hostProviderId: string;
  hostName: string;
  avatarColor: string;
  preview: string;
  status: ActivityGroupStatus;
  unread: number;
  createdAt: number;
};

const STORAGE_KEY = 'maxu-moment-demo-activity-groups-v1';

let groups: ActivityGroup[] = load();
const listeners = new Set<() => void>();

function load(): ActivityGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivityGroup[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return groups;
}

export function useActivityGroups() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getActivityGroup(id: string) {
  return groups.find((g) => g.id === id);
}

export function getActivityGroupByListingId(listingId: string) {
  return groups.find((g) => g.listingId === listingId);
}

export function getActivityGroupByOrderId(orderId: string) {
  return groups.find((g) => g.orderIds.includes(orderId));
}

export function activityGroupIdForListing(listingId: string) {
  return `ag-${listingId}`;
}

function buildGroupName(listing: GroupListing) {
  return `${listing.title} · ${listing.whenLabel}`;
}

export function ensureActivityGroupForOrder(
  order: GroupOrder,
  listing: GroupListing,
): ActivityGroup {
  const id = activityGroupIdForListing(listing.id);
  const existing = groups.find((g) => g.id === id);

  if (existing) {
    if (existing.orderIds.includes(order.id)) {
      return existing;
    }
    const next: ActivityGroup = {
      ...existing,
      orderIds: [...existing.orderIds, order.id],
      preview: `系统：${order.hostName} 的活动群，欢迎新成员加入`,
      unread: existing.unread + 1,
    };
    groups = groups.map((g) => (g.id === id ? next : g));
    emit();
    return next;
  }

  const group: ActivityGroup = {
    id,
    listingId: listing.id,
    orderIds: [order.id],
    name: buildGroupName(listing),
    hostProviderId: listing.hostProviderId,
    hostName: listing.hostName,
    avatarColor: listing.avatarColor,
    preview: `系统：活动群已创建，${listing.whenLabel} ${listing.placeLabel}`,
    status: 'recruiting',
    unread: 1,
    createdAt: Date.now(),
  };
  groups = [group, ...groups];
  emit();
  return group;
}

export function listActivityGroupConversations() {
  return groups.map((g) => ({
    id: g.id,
    kind: 'group' as const,
    subtype: 'activity' as const,
    name: g.name,
    avatarColor: g.avatarColor,
    preview: g.preview,
    time: '刚刚',
    unread: g.unread,
    to: `/messages/chat/${g.id}`,
  }));
}
