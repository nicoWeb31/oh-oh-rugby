import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { RankingEntry } from '@org/models';

const API_URL = 'http://localhost:3333/api';
const COMPETITION_ID = 'comp1';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);
  private readonly global = signal<RankingEntry[]>([]);
  private readonly byMatchday = signal<Record<string, RankingEntry[]>>({});

  loadGlobal(): void {
    this.http.get<RankingEntry[]>(`${API_URL}/ranking`, { params: { competitionId: COMPETITION_ID } }).subscribe({
      next: (ranking) => this.global.set(ranking),
      error: (error) => console.error('Impossible de charger le classement.', error),
    });
  }

  loadForMatchday(matchdayId: string): void {
    this.http.get<RankingEntry[]>(`${API_URL}/ranking`, {
      params: { competitionId: COMPETITION_ID, matchdayId },
    }).subscribe({
      next: (ranking) => this.byMatchday.update((rankings) => ({ ...rankings, [matchdayId]: ranking })),
      error: (error) => console.error('Impossible de charger le classement de la journée.', error),
    });
  }

  getGlobal(): RankingEntry[] {
    return this.global();
  }

  getForMatchday(matchdayId: string): RankingEntry[] {
    return this.byMatchday()[matchdayId] ?? [];
  }
}
