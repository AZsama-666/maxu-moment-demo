import { SELF_PROVIDER_ID } from '../data/mock';
import { useGroupOrders, type GroupOrder } from './groupOrderStore';
import { useOrders, type Order } from './orderStore';
import { useSupplyListings } from './supplyStore';

export type SupplyTaskSummary = {
  pendingAccept: Order[];
  upcoming: Order[];
  companionConfirm: GroupOrder[];
  total: number;
};

export function buildSupplyTasks(
  orders: Order[],
  groupOrders: GroupOrder[],
  ownListingIds: Set<string>,
): SupplyTaskSummary {
  const ownOrders = orders.filter(
    (order) =>
      order.providerId === SELF_PROVIDER_ID && ownListingIds.has(order.momentId),
  );
  const pendingAccept = ownOrders.filter(
    (order) => order.status === 'pending_accept',
  );
  const upcoming = ownOrders.filter(
    (order) =>
      order.status === 'accepted' ||
      order.status === 'booked' ||
      order.status === 'in_progress',
  );
  const companionConfirm = groupOrders.filter(
    (order) =>
      order.hostProviderId === SELF_PROVIDER_ID &&
      order.status === 'awaiting_confirm' &&
      !order.hostConfirmed,
  );
  return {
    pendingAccept,
    upcoming,
    companionConfirm,
    total: pendingAccept.length + upcoming.length + companionConfirm.length,
  };
}

export function useSupplyTasks(): SupplyTaskSummary {
  const listings = useSupplyListings();
  const orders = useOrders();
  const groupOrders = useGroupOrders();
  const ownIds = new Set(listings.map((listing) => listing.id));
  return buildSupplyTasks(orders, groupOrders, ownIds);
}
