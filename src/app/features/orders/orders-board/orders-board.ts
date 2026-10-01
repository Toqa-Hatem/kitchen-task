import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order, OrderStatus, STATUS_FLOW, nextStatus } from '../../../core/models/order.model';import { ActivatedRoute, Router,RouterLink } from '@angular/router';
import { forkJoin, map, timer,EMPTY, catchError, exhaustMap, finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuItem } from '../../../core/models/menu-item.model';
import { MenuService } from '../../../core/services/menu.service';
import { OrdersService } from '../../../core/services/orders.service';
import { BoardFilters } from '../board-filters/board-filters';
import { OrderCardComponent } from '../order-card/order-card';
import { OrderFilters, applyFilters, parseType } from '../orders-board/order-filters/order-filters';

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
};

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-orders-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrderCardComponent, BoardFilters, MatButtonModule, MatProgressSpinnerModule,RouterLink],
  templateUrl: './orders-board.html',
  styleUrl: './orders-board.scss',
})
export class OrdersBoardComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
private readonly snackBar = inject(MatSnackBar);
 private inFlightMoves = 0;
  readonly orders = signal<Order[]>([]);
  readonly menu = signal<ReadonlyMap<string, MenuItem>>(new Map());
  readonly state = signal<LoadState>('loading');

  readonly now = toSignal(timer(0, 1000).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly filters = computed<OrderFilters>(() => {
    const params = this.queryParams();
    return {
      q: params.get('q') ?? '',
      type: parseType(params.get('type')),
    };
  });

  readonly hasActiveFilters = computed(() => !!this.filters().q.trim() || !!this.filters().type);

  private readonly filteredOrders = computed(() => applyFilters(this.orders(), this.filters()));

  readonly columns = computed(() =>
    STATUS_FLOW.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      orders: this.filteredOrders()
        .filter((o) => o.status === status)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    })),
  );

  readonly isEmpty = computed(() => this.orders().length === 0);

  readonly noResults = computed(
    () => this.hasActiveFilters() && this.filteredOrders().length === 0,
  );

   ngOnInit(): void {
    this.load();
    this.startPolling();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({
      orders: this.ordersService.getAll(),
      menu: this.menuService.menuMap$,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ orders, menu }) => {
          this.orders.set(orders);
          this.menu.set(menu);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }
  private startPolling(): void {
    timer(15000, 15000) 
      .pipe(
        exhaustMap(() =>
          this.ordersService.getAll().pipe(
            catchError(() => EMPTY),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((orders) => {
        if (this.inFlightMoves > 0) return;
        this.orders.set(orders);
      });
  }
  moveForward(order: Order): void {
    const target = nextStatus(order.status);
    if (!target) return;

    const previous = order.status;

    this.setStatus(order.id, target);
    this.inFlightMoves++;

    this.ordersService
      .updateStatus(order.id, target)
      .pipe(
        finalize(() => this.inFlightMoves--),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => {
          this.setStatus(order.id, previous);
          this.snackBar.open(
            `Couldn't move order #${order.number}. It was put back.`,
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  private setStatus(id: string, status: OrderStatus): void {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  }
  onFiltersChange(filters: OrderFilters): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: filters.q.trim() || null, type: filters.type },
      queryParamsHandling: 'merge',
      replaceUrl: true,             
    });
  }
}