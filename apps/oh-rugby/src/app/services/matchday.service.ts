import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Competition, Matchday, MatchdayStatus } from '@org/models';

const API_URL = 'http://localhost:3333/api';
const COMPETITION_ID = 'comp1';

@Injectable({ providedIn: 'root' })
export class MatchdayService {
  private readonly http = inject(HttpClient);

  readonly competition = signal<Competition | null>(null);
  readonly matchdays = signal<Matchday[]>([]);

  load(): void {
    this.http.get<Competition>(`${API_URL}/competitions/${COMPETITION_ID}`).subscribe({
      next: (competition) => this.competition.set(competition),
      error: (error) => console.error('Impossible de charger la compétition.', error),
    });
    this.http.get<Matchday[]>(`${API_URL}/matchdays`, { params: { competitionId: COMPETITION_ID } }).subscribe({
      next: (matchdays) => this.matchdays.set(matchdays),
      error: (error) => console.error('Impossible de charger les journées.', error),
    });
  }

  getAll(): Matchday[] {
    return this.matchdays();
  }

  getById(id: string): Matchday | undefined {
    return this.matchdays().find((matchday) => matchday.id === id);
  }

  getStatus(matchday: Matchday): MatchdayStatus {
    const now = new Date();
    const matchDate = new Date(matchday.date);
    const monday = new Date(matchDate);
    monday.setDate(matchDate.getDate() - ((matchDate.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    if (now < monday) return MatchdayStatus.UPCOMING;
    return now <= friday ? MatchdayStatus.ACTIVE : MatchdayStatus.LOCKED;
  }

  getActive(): Matchday | undefined {
    return this.matchdays().find((matchday) => this.getStatus(matchday) === MatchdayStatus.ACTIVE);
  }
}
