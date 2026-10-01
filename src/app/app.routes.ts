import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/orders-board/orders-board').then((m) => m.OrdersBoardComponent),
  },
  {
    path: 'orders/new',
    loadComponent: () =>
      import('./features/orders/new-order/new-order/new-order').then((m) => m.NewOrderComponent),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./features/orders/order-details/order-details').then((m) => m.OrderDetailsComponent),
  },
  { path: '**', redirectTo: 'orders' },
];