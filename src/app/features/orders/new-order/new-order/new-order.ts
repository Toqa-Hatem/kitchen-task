import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { startWith } from 'rxjs';
import { MenuItem } from '../../../../core/models/menu-item.model';
import { NewOrderPayload, OrderItem, OrderType } from '../../../../core/models/order.model';
import { MenuService } from '../../../../core/services/menu.service';
import { OrdersService } from '../../../../core/services/orders.service';
import { calculateBreakdown, calculateSubtotal } from '../../../../core/utils/price-calculator';
import { egyptianMobile, orderTypeRules, requireAtLeastOne } from '../order-validators/order-validators';

type MenuState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-new-order',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, RouterLink, DecimalPipe,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
  ],
  templateUrl: './new-order.html',
  styleUrl: './new-order.scss',
})
export class NewOrderComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // أنواع الطلب اللي بتظهر في الـ select
  readonly types: { value: OrderType; label: string }[] = [
    { value: 'dine-in', label: 'Dine-in' },
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'delivery', label: 'Delivery' },
  ];

  // الـ menu (للـ select والحساب)
  readonly menuList = signal<MenuItem[]>([]);
  readonly menuMap = signal<ReadonlyMap<string, MenuItem>>(new Map());
  readonly menuState = signal<MenuState>('loading');

  // بيمنع الإرسال المزدوج: true من أول ضغطة لحد ما الطلب يخلص
  readonly submitting = signal(false);

  // صف صنف واحد في الفورم
  private createItemGroup(): FormGroup {
    return new FormGroup({
      menuId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      qty: new FormControl(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1), Validators.max(20)],
      }),
      note: new FormControl('', { nonNullable: true }),
    });
  }

  // الفورم الرئيسي
  readonly form = new FormGroup(
    {
      type: new FormControl<OrderType>('dine-in', { nonNullable: true }),
      table: new FormControl<number | null>(null),
      phone: new FormControl<string>('', { nonNullable: true, validators: [egyptianMobile] }),
      // الأصناف: يبدأ بصف واحد، والـ validator بيمنع الحذف لحد الصفر
      items: new FormArray<FormGroup>([this.createItemGroup()], { validators: [requireAtLeastOne] }),
    },
    { validators: [orderTypeRules] },
  );

  // اختصار للـ FormArray علشان الـ template
  get items(): FormArray<FormGroup> {
    return this.form.controls.items;
  }

  // قيمة الفورم كـ Signal: بتتحدث مع كل تغيير، فالإجمالي بيتحسب لايف
  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  // أصناف الفورم الحالية (بعد فلترة الصفوف اللي لسه ماتختارش صنف)
  private readonly currentItems = computed<OrderItem[]>(() =>
    (this.formValue().items ?? [])
      .filter((i) => !!i.menuId)
      .map((i) => ({ menuId: i.menuId ?? '', qty: Number(i.qty) || 0, note: i.note ?? '' })),
  );

  // الإجمالي اللايف (Subtotal + Service + VAT + Total)
  readonly breakdown = computed(() => {
    const subtotal = calculateSubtotal(this.currentItems(), this.menuMap());
    return calculateBreakdown(subtotal, this.formValue().type ?? 'dine-in');
  });

  constructor() {
    // تحميل الـ menu
    this.loadMenu();

    // لما النوع يتغير: نظّف الحقل اللي مش مرتبط بيه
    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type) => {
      if (type !== 'dine-in') this.form.controls.table.setValue(null);
      if (type !== 'delivery') this.form.controls.phone.setValue('');
    });
  }

  loadMenu(): void {
    this.menuState.set('loading');
    this.menuService.menu$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (list) => {
        this.menuList.set(list);
        this.menuMap.set(new Map(list.map((m) => [m.id, m])));
        this.menuState.set('ready');
      },
      error: () => this.menuState.set('error'),
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // السعر الحالي لصف معين (للعرض جنب الصف)
  lineTotal(index: number): number {
    const row = this.items.at(index).getRawValue() as { menuId: string; qty: number };
    return (this.menuMap().get(row.menuId)?.price ?? 0) * (Number(row.qty) || 0);
  }

  submit(): void {
    // لو الفورم غلط أو فيه إرسال شغال: نوقف
    if (this.submitting()) return;
    if (this.form.invalid) {
      // نعلّم كل الحقول touched علشان تظهر رسايل الأخطاء
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const raw = this.form.getRawValue();
    const payload: NewOrderPayload = {
      type: raw.type,
      table: raw.type === 'dine-in' ? Number(raw.table) : null,
      phone: raw.type === 'delivery' ? raw.phone : null,
      items: raw.items.map((i) => ({
        menuId: i['menuId'] as string,
        qty: Number(i['qty']),
        note: ((i['note'] as string) ?? '').trim(),
      })),
    };

    this.ordersService
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/orders']),
        error: () => {
          // نفتح الزرار تاني علشان المستخدم يقدر يحاول
          this.submitting.set(false);
          this.snackBar.open("Couldn't create the order. Please try again.", 'Dismiss', { duration: 5000 });
        },
      });
  }
}