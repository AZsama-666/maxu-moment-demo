import type { Order } from './orderStore';
import { useOrders } from './orderStore';
import { buildSupplyTasks } from './supplyTasks';
import { useSupplyListings } from './supplyStore';
import {
  buyerFulfillPath,
  buyerWaitingPath,
  getOrderPerspective,
  providerFulfillPath,
  providerWaitingPath,
} from '../utils/orderPerspective';

export type MessageReminder = {
  id: string;
  perspective: 'buyer' | 'provider';
  title: string;
  preview: string;
  to: string;
  urgent: boolean;
};

function buyerReminder(order: Order): MessageReminder | null {
  if (order.status === 'pending_payment') return null;
  if (order.status === 'completed' || order.status === 'refunded') return null;

  if (order.status === 'pending_confirm') {
    return {
      id: `buyer-${order.id}`,
      perspective: 'buyer',
      title: order.title,
      preview: `你作为需求方 · 等待 ${order.providerName} 确认预约 · ${order.slotLabel}`,
      to: buyerWaitingPath(order.id),
      urgent: false,
    };
  }

  if (order.status === 'booked') {
    const preview = order.providerReady
      ? order.buyerReady
        ? `你作为需求方 · 双方已就位 · ${order.slotLabel} · 可开始履约`
        : `你作为需求方 · 供给方已就绪 · ${order.slotLabel} · 请进入等待室就位`
      : `你作为需求方 · ${order.slotLabel} · 进入等待室`;
    return {
      id: `buyer-${order.id}`,
      perspective: 'buyer',
      title: order.title,
      preview,
      to: buyerWaitingPath(order.id),
      urgent: order.providerReady && !order.buyerReady,
    };
  }

  if (order.status === 'in_progress') {
    return {
      id: `buyer-${order.id}`,
      perspective: 'buyer',
      title: order.title,
      preview: `你作为需求方 · 履约进行中 · 返回 ${order.form === 'voice' ? '语音' : '视频'}页`,
      to: buyerFulfillPath(order),
      urgent: true,
    };
  }

  return null;
}

function providerReminder(order: Order): MessageReminder | null {
  if (order.status === 'pending_confirm') {
    return {
      id: `provider-${order.id}`,
      perspective: 'provider',
      title: order.title,
      preview: `你作为供给方 · 待确认预约 · ${order.buyerName} · ${order.slotLabel}`,
      to: '/profile/my-moments/tasks',
      urgent: true,
    };
  }

  if (order.status === 'booked') {
    const preview = order.buyerReady
      ? order.providerReady
        ? `你作为供给方 · 双方已就位 · ${order.slotLabel} · 可开始履约`
        : `你作为供给方 · 买家已就位 · ${order.slotLabel} · 请进入等待室标记就绪`
      : `你作为供给方 · ${order.slotLabel} · 待履约`;
    return {
      id: `provider-${order.id}`,
      perspective: 'provider',
      title: order.title,
      preview,
      to: providerWaitingPath(order.id),
      urgent: order.buyerReady && !order.providerReady,
    };
  }

  if (order.status === 'in_progress') {
    return {
      id: `provider-${order.id}`,
      perspective: 'provider',
      title: order.title,
      preview: `你作为供给方 · 服务进行中 · 返回履约页`,
      to: providerFulfillPath(order),
      urgent: true,
    };
  }

  return null;
}

export function buildMessageReminders(
  orders: Order[],
  ownListingIds: Set<string>,
): MessageReminder[] {
  const supply = buildSupplyTasks(orders, [], ownListingIds);
  const providerOrders = [
    ...supply.pendingConfirm,
    ...supply.upcoming.filter((o) => o.status !== 'completed'),
  ];

  const reminders: MessageReminder[] = [];

  for (const order of orders) {
    if (getOrderPerspective(order) === 'buyer') {
      const item = buyerReminder(order);
      if (item) reminders.push(item);
    }
  }

  for (const order of providerOrders) {
    const item = providerReminder(order);
    if (item) reminders.push(item);
  }

  return reminders.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}

export function useMessageReminders(): MessageReminder[] {
  const orders = useOrders();
  const listings = useSupplyListings();
  const ownIds = new Set(listings.map((l) => l.id));
  return buildMessageReminders(orders, ownIds);
}
