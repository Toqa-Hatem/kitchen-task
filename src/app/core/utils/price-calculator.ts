import { OrderItem, OrderType } from '../models/order.model';
import { MenuItem } from '../models/menu-item.model';

export const SERVICE_RATE = 0.12;
export const VAT_RATE = 0.14;

export interface PriceBreakdown {
  subtotal: number; 
  service: number;  
  vat: number;     
  total: number;   
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculateSubtotal(
  items: readonly OrderItem[],            
  menu: ReadonlyMap<string, MenuItem>,    
): number {
  const sum = items.reduce((acc, item) => {
    const price = menu.get(item.menuId)?.price ?? 0;
    return acc + price * item.qty;
  }, 0);
  return round2(sum);
}

export function calculateBreakdown(subtotal: number, type: OrderType): PriceBreakdown {
  const service = type === 'dine-in' ? round2(subtotal * SERVICE_RATE) : 0;
  const vat = round2((subtotal + service) * VAT_RATE);
  const total = round2(subtotal + service + vat);
  return { subtotal, service, vat, total };
}