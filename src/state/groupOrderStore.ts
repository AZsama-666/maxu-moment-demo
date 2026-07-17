import { useSyncExternalStore } from 'react';
import { getGroupListing } from '../data/marketMock';

export type GroupOrderStatus = 'awaiting_confirm' | 'completed';

export type GroupOrder = {
  id: string;
  listingId: string;
  title: string;
  hostName: string;
  priceYuan: number;
  whenLabel: string;
  placeLabel: string;
  status: GroupOrderStatus;
  buyerConfirmed: boolean;
  hostConfirmed: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'maxu-moment-demo-group-orders-v1';

let orders: GroupOrder[] = load();
const listeners = new Set<() => void>();

function load(): GroupOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GroupOrder[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
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
  return orders;
}

export function useGroupOrders() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getGroupOrder(id: string) {
  return orders.find((o) => o.id === id);
}

export function createGroupOrder(listingId: string): GroupOrder | null {
  const listing = getGroupListing(listingId);
  if (!listing || listing.seatsLeft <= 0) return null;
  const order: GroupOrder = {
    id: `go-${Date.now()}`,
    listingId: listing.id,
    title: listing.title,
    hostName: listing.hostName,
    priceYuan: listing.priceYuan,
    whenLabel: listing.whenLabel,
    placeLabel: listing.placeLabel,
    status: 'awaiting_confirm',
    buyerConfirmed: false,
    hostConfirmed: false,
    createdAt: Date.now(),
  };
  orders = [order, ...orders];
  emit();
  return order;
}

export function confirmGroupOrderSide(
  orderId: string,
  side: 'buyer' | 'host',
): GroupOrder | null {
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  const cur = orders[idx];
  if (cur.status === 'completed') return cur;
  const next: GroupOrder = {
    ...cur,
    buyerConfirmed: side === 'buyer' ? true : cur.buyerConfirmed,
    hostConfirmed: side === 'host' ? true : cur.hostConfirmed,
  };
  if (next.buyerConfirmed && next.hostConfirmed) {
    next.status = 'completed';
  }
  orders = orders.map((o, i) => (i === idx ? next : o));
  emit();
  return next;
}
