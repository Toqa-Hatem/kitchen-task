import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { API_URL } from '../config/api.config';
import { MenuItem } from '../models/menu-item.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  // to make it not allowed to use outside 
  private readonly http = inject(HttpClient);
  readonly menu$: Observable<MenuItem[]> = this.http

    .get<MenuItem[]>(`${API_URL}/menu`)  
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  // using map to make search easy 
  readonly menuMap$: Observable<Map<string, MenuItem>> = this.menu$.pipe(
    map((items) => new Map(items.map((m) => [m.id, m]))),
  );
}