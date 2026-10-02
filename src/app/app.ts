import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="hero">
      <a routerLink="/orders" class="brand">🍽️ Kitchen Orders Board</a>
      <p class="tagline">Track every order from the kitchen to the table</p>
    </header>
    <main class="container-fluid py-3 page">
      <router-outlet />
    </main>
  `,
  styles: `
    .hero {
      text-align: center;
      padding: 2rem 1rem 2.25rem;
      color: #fff;
      background: linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%);
      box-shadow: 0 4px 16px rgb(15 23 42 / 0.2);
    }
    .brand {
      display: inline-block;
      color: inherit;
      text-decoration: none;
      font-size: clamp(1.75rem, 5vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .tagline {
      margin: 0.4rem 0 0;
      opacity: 0.8;
      font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    }
    .page { max-width: 1400px; }
  `,
})
export class App {}