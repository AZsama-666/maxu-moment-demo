import { SELF_PROVIDER_ID } from '../data/mock';
import type { Order } from '../state/orderStore';
import { getOneToOneSupplyListing } from '../state/supplyStore';

export type OrderPerspective = 'buyer' | 'provider';

export function isProviderOrder(order: Order): boolean {
  if (order.providerId !== SELF_PROVIDER_ID) return false;
  return Boolean(getOneToOneSupplyListing(order.momentId));
}

export function getOrderPerspective(order: Order): OrderPerspective {
  return isProviderOrder(order) ? 'provider' : 'buyer';
}

export function buyerWaitingPath(orderId: string): string {
  return `/waiting/${orderId}`;
}

export function providerWaitingPath(orderId: string): string {
  return `/supply/waiting/${orderId}`;
}

export function buyerFulfillPath(order: Order): string {
  return order.form === 'voice'
    ? `/fulfill/voice/${order.id}`
    : `/fulfill/video/${order.id}`;
}

export function providerFulfillPath(order: Order): string {
  return order.form === 'voice'
    ? `/supply/fulfill/voice/${order.id}`
    : `/supply/fulfill/video/${order.id}`;
}

export function waitingPathForOrder(order: Order): string {
  return getOrderPerspective(order) === 'provider'
    ? providerWaitingPath(order.id)
    : buyerWaitingPath(order.id);
}

export function fulfillPathForOrder(order: Order): string {
  return getOrderPerspective(order) === 'provider'
    ? providerFulfillPath(order)
    : buyerFulfillPath(order);
}
