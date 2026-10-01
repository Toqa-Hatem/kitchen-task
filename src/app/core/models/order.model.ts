// fixed type to show on orders 
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

// fixed status to show on orders 
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served';

// interface for each item that will appear with order 
export interface OrderItem {
  menuId: string; 
  qty: number;    
  note: string;   
}

// like given API
export interface Order {
  id: string;             
  number: number;          
  type: OrderType;        
  table: number | null;   
  phone: string | null;   
  status: OrderStatus;    
  createdAt: string;      
  items: OrderItem[];     
}

// data that we will sent with form
export type NewOrderPayload = Omit<Order, 'id' | 'number' | 'status' | 'createdAt'>;
//status readonly to be not editable 
export const STATUS_FLOW: readonly OrderStatus[] = ['new', 'preparing', 'ready', 'served'];

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}