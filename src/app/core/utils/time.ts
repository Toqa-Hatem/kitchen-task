import { Order } from '../models/order.model';

export const LATE_AFTER_MS = 20 * 60 * 1000;

export function elapsedMs(createdAt: string, now: number): number {
  return Math.max(0, now - new Date(createdAt).getTime());
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function isLate(order: Order, now: number): boolean {
  const pending = order.status === 'new' || order.status === 'preparing';
  return pending && elapsedMs(order.createdAt, now) > LATE_AFTER_MS;
}