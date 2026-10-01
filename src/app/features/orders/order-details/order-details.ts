import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuItem } from '../../../core/models/menu-item.model';
import { Order } from '../../../core/models/order.model';
import { MenuService } from '../../../core/services/menu.service';
import { OrdersService } from '../../../core/services/orders.service';
import { calculateBreakdown, calculateSubtotal } from '../../../core/utils/price-calculator';

type DetailsState = 'loading' | 'ready' | 'notfound' | 'error';

@Component({
  selector: 'app-order-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss',
})
export class OrderDetailsComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  
  readonly order = signal<Order | null>(null);                        
  readonly menu = signal<ReadonlyMap<string, MenuItem>>(new Map());  
  readonly state = signal<DetailsState>('loading');                   

  private id = '';

  readonly lines = computed(() => {
    const order = this.order();
    if (!order) return [];
    return order.items.map((item) => {
      const menuItem = this.menu().get(item.menuId); 
      const unitPrice = menuItem?.price ?? 0;        
      return {
        name: menuItem?.name ?? 'Unknown item',      
        qty: item.qty,
        note: item.note,
        unitPrice,
        lineTotal: unitPrice * item.qty,            
      };
    });
  });

  readonly breakdown = computed(() => {
    const order = this.order();
    if (!order) return null;
    const subtotal = calculateSubtotal(order.items, this.menu());
    return calculateBreakdown(subtotal, order.type);
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.id = params.get('id') ?? '';
      this.load();
    });
  }

  load(): void {
    this.state.set('loading');
    forkJoin({
      order: this.ordersService.getById(this.id), 
      menu: this.menuService.menuMap$,          
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ order, menu }) => {
          this.order.set(order);
          this.menu.set(menu);
          this.state.set('ready');
        },
        error: (err: unknown) => {
          const notFound = err instanceof HttpErrorResponse && err.status === 404;
          this.state.set(notFound ? 'notfound' : 'error');
        },
      });
  }
}