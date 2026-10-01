import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { NewOrderPayload, Order, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/orders`;

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.url);
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.url}/${id}`);
  }


  updateStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.url}/${id}`, { status });
  }

  create(payload: NewOrderPayload): Observable<Order> {
    return this.getAll().pipe(
      map((orders) => Math.max(0, ...orders.map((o) => o.number)) + 1),
      switchMap((number) => {
        const order: Order = {
          ...payload,                            
          id: String(number),                   
          number,                             
          status: 'new',                        
          createdAt: new Date().toISOString(),   
        };
        return this.http.post<Order>(this.url, order);
      }),
    );
  }
}