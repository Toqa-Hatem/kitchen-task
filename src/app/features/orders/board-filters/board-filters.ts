import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
// import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrderType } from '../../../core/models/order.model';
import { OrderFilters } from '../orders-board/order-filters/order-filters';

@Component({
  selector: 'app-board-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './board-filters.html',
  styleUrl: './board-filters.scss',
})
export class BoardFilters {
  readonly filters = input.required<OrderFilters>();
  readonly filtersChange = output<OrderFilters>();

  readonly search = new FormControl('', { nonNullable: true });

  readonly typeOptions: { label: string; value: OrderType | null }[] = [
    { label: 'All', value: null },
    { label: 'Dine-in', value: 'dine-in' },
    { label: 'Takeaway', value: 'takeaway' },
    { label: 'Delivery', value: 'delivery' },
  ];

  constructor() {
    effect(() => {
      const q = this.filters().q;
      if (this.search.value !== q) this.search.setValue(q, { emitEvent: false });
    });

    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.filtersChange.emit({ ...this.filters(), q }));
  }

  onTypeChange(type: OrderType | null): void {
    this.filtersChange.emit({ ...this.filters(), type });
  }
}