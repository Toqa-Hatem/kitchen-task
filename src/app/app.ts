import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule],
   template: `
    <mat-toolbar color="primary">
      <a routerLink="/orders" class="brand">🍽️ Kitchen Orders Board</a>
    </mat-toolbar>
    <main class="container-fluid py-3 page">
      <router-outlet />
    </main>
  `,
  styles: `
    .brand {
      color: inherit;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
    }
    .page { max-width: 1400px; }
  `,
})
export class App {}