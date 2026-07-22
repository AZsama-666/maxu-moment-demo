import { useSyncExternalStore } from 'react';
import {
  deductGroupSeatOnPay,
  getDualConfirmListing,
  getGroupListing,
} from '../data/marketMock';
import { ensureActivityGroupForOrder } from './activityGroupStore';
import {
  getSupplyListing,
  updateCompanionSupply,
} from './supplyStore';

export type GroupOrderPaymentStatus = 'pending_payment' | 'paid';
export type GroupOrderStatus = 'awaiting_confirm' | 'completed';
export type GroupPayMethod = 'cash' | 'coin';

export type GroupOrder = {
  id: string;
  listingId: string;
  supplyListingId?: string;
  hostProviderId: string;
  title: string;
  hostName: string;
  priceYuan: number;
  whenLabel: string;
  placeLabel: string;
  status: GroupOrderStatus;
  paymentStatus: GroupOrderPaymentStatus;
  payMethod?: GroupPayMethod;
  buyerConfirmed: boolean;
  hostConfirmed: boolean;
  createdAt: number;
  paidAt?: number;
};

const STORAGE_KEY = 'maxu-moment-demo-group-orders-v1';

let orders: GroupOrder[] = load();
const listeners = new Set<() => void>();

function normalizeOrder(order: GroupOrder): GroupOrder {
  return {
    ...order,
    hostProviderId: order.hostProviderId ?? '',
    paymentStatus: order.paymentStatus ?? 'paid',
  };
}

function load(): GroupOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? (JSON.parse(raw) as GroupOrder[]).map(normalizeOrder)
      : [];
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

export function isGroupOrderPaid(order: GroupOrder): boolean {
  return order.paymentStatus === 'paid';
}

export function isGroupListingOrder(order: GroupOrder): boolean {
  return Boolean(getGroupListing(order.listingId));
}

export function createGroupOrder(listingId: string): GroupOrder | null {
  const listing = getDualConfirmListing(listingId);
  if (!listing) return null;

  const remaining =
    listing.kind === 'group' ? listing.seatsLeft : listing.remaining;
  if (remaining <= 0) return null;

  const hostProviderId =
    listing.kind === 'group' ? listing.hostProviderId : listing.providerId;
  const hostName =
    listing.kind === 'group' ? listing.hostName : listing.providerName;
  const isGroup = listing.kind === 'group';

  const order: GroupOrder = {
    id: `go-${Date.now()}`,
    listingId: listing.id,
    supplyListingId:
      listing.kind === 'companion' ? listing.supplyListingId : undefined,
    hostProviderId,
    title: listing.title,
    hostName,
    priceYuan: listing.priceYuan,
    whenLabel: listing.whenLabel,
    placeLabel: listing.placeLabel,
    status: 'awaiting_confirm',
    paymentStatus: isGroup ? 'pending_payment' : 'paid',
    buyerConfirmed: false,
    hostConfirmed: false,
    createdAt: Date.now(),
    paidAt: isGroup ? undefined : Date.now(),
  };
  orders = [order, ...orders];
  if (listing.kind === 'companion' && listing.supplyListingId) {
    const supply = getSupplyListing(listing.supplyListingId);
    if (supply?.kind === 'companion') {
      updateCompanionSupply(supply.id, {
        remaining: Math.max(0, supply.remaining - 1),
      });
    }
  }
  emit();
  return order;
}

export function payGroupOrder(
  orderId: string,
  payMethod: GroupPayMethod = 'cash',
): GroupOrder | null {
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;

  const cur = orders[idx];
  if (cur.paymentStatus === 'paid') return cur;
  if (cur.paymentStatus !== 'pending_payment') return null;

  const groupListing = getGroupListing(cur.listingId);
  if (groupListing) {
    if (!deductGroupSeatOnPay(groupListing.id)) return null;
    const paidOrder: GroupOrder = {
      ...cur,
      paymentStatus: 'paid',
      payMethod,
      paidAt: Date.now(),
    };
    ensureActivityGroupForOrder(paidOrder, groupListing);
    orders = orders.map((o, i) => (i === idx ? paidOrder : o));
    emit();
    return paidOrder;
  }

  const paidOrder: GroupOrder = {
    ...cur,
    paymentStatus: 'paid',
    payMethod,
    paidAt: Date.now(),
  };
  orders = orders.map((o, i) => (i === idx ? paidOrder : o));
  emit();
  return paidOrder;
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
