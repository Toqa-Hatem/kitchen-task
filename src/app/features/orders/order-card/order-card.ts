import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MenuItem } from '../../../core/models/menu-item.model';
import { Order, OrderStatus, nextStatus } from '../../../core/models/order.model';
import { calculateSubtotal } from '../../../core/utils/price-calculator';
import { elapsedMs, formatElapsed, isLate } from '../../../core/utils/time';
import { RouterLink } from '@angular/router';

const ACTION_LABELS: Record<OrderStatus, string> = {
  new: '',
  preparing: 'Start preparing',
  ready: 'Mark ready',
  served: 'Mark served',
};

@Component({
  selector: 'app-order-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, DecimalPipe,RouterLink],
  templateUrl: './order-card.html',
  styleUrl: './order-card.scss',
})
export class OrderCardComponent {
  readonly order = input.required<Order>();
  readonly menu = input.required<ReadonlyMap<string, MenuItem>>();
  readonly now = input.required<number>();

  readonly advance = output<Order>();

  readonly itemCount = computed(() =>
    this.order().items.reduce((sum, item) => sum + item.qty, 0),
  );
  readonly subtotal = computed(() => calculateSubtotal(this.order().items, this.menu()));
  readonly elapsed = computed(() => formatElapsed(elapsedMs(this.order().createdAt, this.now())));
  readonly late = computed(() => isLate(this.order(), this.now()));
  readonly served = computed(() => this.order().status === 'served');

  readonly next = computed(() => nextStatus(this.order().status));

  readonly actionLabel = computed(() => {
    const next = this.next();
    return next ? ACTION_LABELS[next] : '';
  });

  readonly label = computed(() => {
    const o = this.order();
    if (o.type === 'dine-in') return `T-${o.table}`;
    return o.type === 'takeaway' ? 'Takeaway' : 'Delivery';
  });
}