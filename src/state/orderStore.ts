import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  getMoment as getStaticMoment,
  getProvider,
  normalizeMomentSchedule,
  type InteractionForm,
  type MomentItem,
} from '../data/mock';
import {
  DEFAULT_SLOT_CAPACITY,
  findBookableSlot,
  isNearTermSchedule,
  migrateScheduleFields,
  NEAR_TERM_REFUND_LEAD_MIN,
  stockKey,
} from '../utils/bookingSlots';
import { getOneToOneSupplyListing } from './supplyStore';

export type OrderStatus =
  | 'pending_payment'
  | 'pending_confirm'
  | 'pending_accept'
  | 'accepted'
  | 'booked'
  | 'in_progress'
  | 'completed'
  | 'refunded';

export type PayMethod = 'cash' | 'coin';
export type FulfillTiming = 'scheduled';

export type Order = {
  id: string;
  momentId: string;
  slotId: string;
  form: InteractionForm;
  title: string;
  providerName: string;
  providerId: string;
  slotLabel: string;
  slotStartAt: number;
  nearTerm: boolean;
  providerReady: boolean;
  priceYuan: number;
  durationSec: number;
  quantity: number;
  payMethod: PayMethod;
  timing: FulfillTiming;
  status: OrderStatus;
  createdAt: number;
  paidAt?: number;
  acceptedAt?: number;
};

export const MAX_ORDER_QTY = 5;

const STORAGE_KEY = 'maxu-moment-demo-orders-v3';
const STOCK_KEY = 'maxu-moment-demo-stock-v2';

type StockMap = Record<string, number>;

type StoreSnapshot = {
  orders: Order[];
  stock: StockMap;
};

let snapshot: StoreSnapshot = loadSnapshot();
const listeners = new Set<() => void>();

function loadSnapshot(): StoreSnapshot {
  try {
    const ordersRaw = localStorage.getItem(STORAGE_KEY);
    const stockRaw = localStorage.getItem(STOCK_KEY);
    const orders = ordersRaw ? (JSON.parse(ordersRaw) as Order[]) : [];
    return {
      orders: orders.map(normalizeOrder),
      stock: stockRaw ? (JSON.parse(stockRaw) as StockMap) : {},
    };
  } catch {
    return { orders: [], stock: {} };
  }
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    timing: 'scheduled',
    providerId: order.providerId ?? '',
    quantity: order.quantity ?? 1,
    slotStartAt: order.slotStartAt ?? order.createdAt,
    nearTerm: order.nearTerm ?? false,
    providerReady: order.providerReady ?? false,
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.orders));
  localStorage.setItem(STOCK_KEY, JSON.stringify(snapshot.stock));
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
  return snapshot;
}

function setSnapshot(next: StoreSnapshot) {
  snapshot = next;
  emit();
}

function resolveMoment(momentId: string): MomentItem | undefined {
  const fromSupply = getOneToOneSupplyListing(momentId);
  if (fromSupply) {
    const { status: _s, createdAt: _c, kind: _k, ...item } = fromSupply;
    return normalizeMomentSchedule(item);
  }
  const staticM = getStaticMoment(momentId);
  return staticM ? normalizeMomentSchedule(staticM) : undefined;
}

export function getRemainingStock(momentId: string, slotId: string): number {
  const key = stockKey(momentId, slotId);
  if (key in snapshot.stock) return snapshot.stock[key];
  const moment = resolveMoment(momentId);
  if (!moment) return 0;
  const config = migrateScheduleFields(moment);
  const slot = findBookableSlot(momentId, config, slotId, new Date(), () =>
    moment.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
  );
  if (!slot) return 0;
  return moment.slotCapacity ?? DEFAULT_SLOT_CAPACITY;
}

/** @deprecated 使用 getRemainingStock */
export function getRemaining(momentId: string, slotId: string): number {
  return getRemainingStock(momentId, slotId);
}

export function createPendingOrder(input: {
  momentId: string;
  slotId: string;
  payMethod: PayMethod;
  quantity?: number;
}): Order | null {
  const moment = resolveMoment(input.momentId);
  if (!moment) return null;

  const config = migrateScheduleFields(moment);
  if (!config.bookingOpen) return null;

  const slot = findBookableSlot(
    input.momentId,
    config,
    input.slotId,
    new Date(),
    getRemainingStock,
  );
  if (!slot || slot.remaining <= 0) return null;

  const quantity = Math.max(
    1,
    Math.min(MAX_ORDER_QTY, Math.floor(input.quantity ?? 1)),
  );
  if (quantity > slot.remaining) return null;

  const provider = getProvider(moment.providerId);
  if (!provider) return null;

  const order: Order = {
    id: `ord-${Date.now()}`,
    momentId: moment.id,
    slotId: slot.id,
    form: moment.form,
    title: moment.title,
    providerName: provider.name,
    providerId: moment.providerId,
    slotLabel: slot.displayLabel,
    slotStartAt: slot.startMs,
    nearTerm: isNearTermSchedule(config),
    providerReady: false,
    priceYuan: Number((moment.priceYuan * quantity).toFixed(1)),
    durationSec: moment.durationSec * quantity,
    quantity,
    payMethod: input.payMethod,
    timing: 'scheduled',
    status: 'pending_payment',
    createdAt: Date.now(),
  };

  setSnapshot({ ...snapshot, orders: [order, ...snapshot.orders] });
  return order;
}

function deductStock(order: Order): boolean {
  const remaining = getRemainingStock(order.momentId, order.slotId);
  if (remaining < order.quantity) return false;
  const key = stockKey(order.momentId, order.slotId);
  setSnapshot({
    ...snapshot,
    stock: { ...snapshot.stock, [key]: remaining - order.quantity },
  });
  return true;
}

export function payOrder(orderId: string): boolean {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'pending_payment') return false;

  if (order.nearTerm) {
    if (!deductStock(order)) return false;
    setSnapshot({
      ...snapshot,
      orders: snapshot.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'booked' as const, paidAt: Date.now() }
          : o,
      ),
    });
    return true;
  }

  setSnapshot({
    ...snapshot,
    orders: snapshot.orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'pending_confirm' as const, paidAt: Date.now() }
        : o,
    ),
  });
  return true;
}

export function confirmBooking(orderId: string): boolean {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'pending_confirm') return false;
  if (!deductStock(order)) return false;
  setSnapshot({
    ...snapshot,
    orders: snapshot.orders.map((o) =>
      o.id === orderId ? { ...o, status: 'booked' as const } : o,
    ),
  });
  return true;
}

export function markProviderReady(orderId: string): boolean {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'booked') return false;
  setSnapshot({
    ...snapshot,
    orders: snapshot.orders.map((o) =>
      o.id === orderId ? { ...o, providerReady: true } : o,
    ),
  });
  return true;
}

export function refundOrder(orderId: string): boolean {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order) return false;
  const refundable =
    order.status === 'pending_confirm' ||
    order.status === 'pending_accept' ||
    order.status === 'booked';
  if (!refundable) return false;

  const key = stockKey(order.momentId, order.slotId);
  const nextStock = { ...snapshot.stock };
  if (order.status === 'booked' && key in nextStock) {
    nextStock[key] = (nextStock[key] ?? 0) + order.quantity;
  }

  setSnapshot({
    orders: snapshot.orders.map((o) =>
      o.id === orderId ? { ...o, status: 'refunded' as const } : o,
    ),
    stock: nextStock,
  });
  return true;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  setSnapshot({
    ...snapshot,
    orders: snapshot.orders.map((o) =>
      o.id === orderId ? { ...o, status } : o,
    ),
  });
}

export function getOrder(orderId: string) {
  return snapshot.orders.find((o) => o.id === orderId);
}

export function useOrders() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).orders;
}

export function useOrder(orderId: string | undefined) {
  const orders = useOrders();
  return orders.find((o) => o.id === orderId);
}

export function usePendingConfirmOrders() {
  return useOrders().filter((o) => o.status === 'pending_confirm');
}

export function useRemaining(momentId: string, slotId: string) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return getRemainingStock(momentId, slotId);
}

export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return '待支付';
    case 'pending_confirm':
      return '待供给确认';
    case 'pending_accept':
      return '待接单';
    case 'accepted':
      return '已接单待履约';
    case 'booked':
      return '已预约待履约';
    case 'in_progress':
      return '履约中';
    case 'completed':
      return '已完成';
    case 'refunded':
      return '已退款';
  }
}

export function timingLabel(_timing: FulfillTiming): string {
  return '预约';
}

export function slotCountdownSec(order: Order, now = Date.now()): number | null {
  if (!order.slotStartAt) return null;
  return Math.max(0, Math.ceil((order.slotStartAt - now) / 1000));
}

export function shouldOfferNearTermRefund(order: Order, now = Date.now()): boolean {
  if (!order.nearTerm || order.providerReady) return false;
  if (order.status !== 'booked') return false;
  const leadMs = NEAR_TERM_REFUND_LEAD_MIN * 60 * 1000;
  return now >= order.slotStartAt - leadMs && now < order.slotStartAt;
}

export function shouldAutoRefundNearTerm(order: Order, now = Date.now()): boolean {
  if (!order.nearTerm) return false;
  if (order.status !== 'booked' && order.status !== 'in_progress') return false;
  return now >= order.slotStartAt && order.status === 'booked';
}

export function useHydrateStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const onStorage = () => {
      snapshot = loadSnapshot();
      emit();
      setTick((t) => t + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return useCallback(() => setTick((t) => t + 1), []);
}
