import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getMoment, getProvider, getSlot } from '../data/catalog';
import { ASAP_SLOT_ID, isAcceptingNow, type InteractionForm } from '../data/mock';
import {
  getSupplyListing,
  recordStaticResponse,
  recordSupplyResponse,
} from './supplyStore';

export type OrderStatus =
  | 'pending_payment'
  | 'pending_accept'
  | 'accepted'
  | 'booked'
  | 'in_progress'
  | 'completed'
  | 'refunded';

export type PayMethod = 'cash' | 'coin';
export type FulfillTiming = 'asap' | 'scheduled';

/** 尽快单接单 SLA（秒），演示用 2 分钟 */
export const ASAP_SLA_SEC = 120;

export type Order = {
  id: string;
  momentId: string;
  slotId: string;
  form: InteractionForm;
  title: string;
  providerName: string;
  providerId: string;
  slotLabel: string;
  /** 总价（单价 × 份数） */
  priceYuan: number;
  /** 总时长秒（单份时长 × 份数） */
  durationSec: number;
  /** 购买份数，默认 1 */
  quantity: number;
  payMethod: PayMethod;
  timing: FulfillTiming;
  status: OrderStatus;
  createdAt: number;
  paidAt?: number;
  slaSec?: number;
  acceptedAt?: number;
};

export const MAX_ORDER_QTY = 5;

const STORAGE_KEY = 'maxu-moment-demo-orders-v2';
const STOCK_KEY = 'maxu-moment-demo-stock';

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
      orders: orders.map((o) => ({
        ...o,
        timing: o.timing ?? 'scheduled',
        providerId: o.providerId ?? '',
        quantity: o.quantity ?? 1,
      })),
      stock: stockRaw ? (JSON.parse(stockRaw) as StockMap) : {},
    };
  } catch {
    return { orders: [], stock: {} };
  }
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

export function getRemaining(momentId: string, slotId: string): number {
  if (slotId === ASAP_SLOT_ID) return 999;
  const key = `${momentId}:${slotId}`;
  if (key in snapshot.stock) return snapshot.stock[key];
  return getSlot(momentId, slotId)?.remaining ?? 0;
}

export function createPendingOrder(input: {
  momentId: string;
  slotId: string;
  payMethod: PayMethod;
  timing: FulfillTiming;
  quantity?: number;
}): Order | null {
  const moment = getMoment(input.momentId);
  if (!moment) return null;

  const provider = getProvider(moment.providerId);
  if (!provider) return null;

  const quantity = Math.max(
    1,
    Math.min(MAX_ORDER_QTY, Math.floor(input.quantity ?? 1)),
  );
  const priceYuan = Number((moment.priceYuan * quantity).toFixed(1));
  const durationSec = moment.durationSec * quantity;

  if (input.timing === 'asap') {
    if (!isAcceptingNow(moment)) return null;
    const waitMin = Math.max(1, moment.avgResponseMin || 5);
    const order: Order = {
      id: `ord-${Date.now()}`,
      momentId: moment.id,
      slotId: ASAP_SLOT_ID,
      form: moment.form,
      title: moment.title,
      providerName: provider.name,
      providerId: moment.providerId,
      slotLabel: `尽快（平均响应时长 ${waitMin} 分钟内开始）`,
      priceYuan,
      durationSec,
      quantity,
      payMethod: input.payMethod,
      timing: 'asap',
      status: 'pending_payment',
      createdAt: Date.now(),
      slaSec: ASAP_SLA_SEC,
    };
    setSnapshot({ ...snapshot, orders: [order, ...snapshot.orders] });
    return order;
  }

  const slot = getSlot(input.momentId, input.slotId);
  if (!slot) return null;
  if (getRemaining(input.momentId, input.slotId) <= 0) return null;

  const order: Order = {
    id: `ord-${Date.now()}`,
    momentId: moment.id,
    slotId: slot.id,
    form: moment.form,
    title: moment.title,
    providerName: provider.name,
    providerId: moment.providerId,
    slotLabel: slot.label,
    priceYuan,
    durationSec,
    quantity,
    payMethod: input.payMethod,
    timing: 'scheduled',
    status: 'pending_payment',
    createdAt: Date.now(),
  };

  setSnapshot({ ...snapshot, orders: [order, ...snapshot.orders] });
  return order;
}

export function payOrder(orderId: string): boolean {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'pending_payment') return false;

  if (order.timing === 'asap') {
    setSnapshot({
      ...snapshot,
      orders: snapshot.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'pending_accept' as const, paidAt: Date.now() }
          : o,
      ),
    });
    return true;
  }

  const remaining = getRemaining(order.momentId, order.slotId);
  if (remaining <= 0) return false;
  const stockKey = `${order.momentId}:${order.slotId}`;
  setSnapshot({
    orders: snapshot.orders.map((o) =>
      o.id === orderId ? { ...o, status: 'booked' as const } : o,
    ),
    stock: { ...snapshot.stock, [stockKey]: remaining - 1 },
  });
  return true;
}

export function acceptOrder(orderId: string): boolean {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'pending_accept') return false;

  const acceptedAt = Date.now();
  const responseMin = Math.max(1, Math.round((acceptedAt - order.createdAt) / 60000) || 1);

  const supply = getSupplyListing(order.momentId);
  if (supply) {
    recordSupplyResponse(order.momentId, responseMin);
  } else {
    const moment = getMoment(order.momentId);
    if (moment) {
      recordStaticResponse(
        order.momentId,
        {
          fulfilledCount: moment.fulfilledCount,
          avgResponseMin: moment.avgResponseMin,
          acceptingPaused: moment.acceptingPaused,
        },
        responseMin,
      );
    }
  }

  setSnapshot({
    ...snapshot,
    orders: snapshot.orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'accepted' as const, acceptedAt }
        : o,
    ),
  });
  return true;
}

/** 尽快单超时/主动退款：仅待接单可退 */
export function refundOrder(orderId: string): boolean {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'pending_accept') return false;
  setSnapshot({
    ...snapshot,
    orders: snapshot.orders.map((o) =>
      o.id === orderId ? { ...o, status: 'refunded' as const } : o,
    ),
  });
  return true;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  setSnapshot({
    ...snapshot,
    orders: snapshot.orders.map((o) => {
      if (o.id !== orderId) return o;
      if (status === 'completed') {
        // fulfilled count already bumped on accept for asap; for scheduled bump here lightly via supply if needed
      }
      return { ...o, status };
    }),
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

export function usePendingAcceptOrders() {
  return useOrders().filter((o) => o.status === 'pending_accept');
}

export function useRemaining(momentId: string, slotId: string) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (slotId === ASAP_SLOT_ID) return 999;
  const key = `${momentId}:${slotId}`;
  if (key in snap.stock) return snap.stock[key];
  return getSlot(momentId, slotId)?.remaining ?? 0;
}

export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return '待支付';
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

/** 待接单剩余秒数；非待接单返回 null */
export function pendingAcceptRemainSec(order: Order, now = Date.now()): number | null {
  if (order.status !== 'pending_accept' || !order.paidAt) return null;
  const sla = (order.slaSec ?? ASAP_SLA_SEC) * 1000;
  return Math.max(0, Math.ceil((order.paidAt + sla - now) / 1000));
}

export function timingLabel(timing: FulfillTiming): string {
  return timing === 'asap' ? '尽快' : '预约';
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
