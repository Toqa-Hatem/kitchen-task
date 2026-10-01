import { Order, OrderType } from '../../../../core/models/order.model';

export interface OrderFilters {
  q: string;
  type: OrderType | null;
}

export const ORDER_TYPES: readonly OrderType[] = ['dine-in', 'takeaway', 'delivery'];

export function parseType(value: string | null): OrderType | null {
  return ORDER_TYPES.find((t) => t === value) ?? null;
}

export function applyFilters(orders: readonly Order[], filters: OrderFilters): Order[] {
  const q = filters.q.trim().toLowerCase();
  return orders.filter((o) => {
    if (filters.type && o.type !== filters.type) return false;
    if (!q) return true;
    return String(o.number).includes(q) || (o.table !== null && String(o.table).includes(q));
  });
}