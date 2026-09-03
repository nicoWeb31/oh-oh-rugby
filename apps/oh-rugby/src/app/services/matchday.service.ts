import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Competition, Match, Matchday, MatchdayStatus, MatchResult } from '@org/models';
import { environment } from '../../environments/environment';
import { RankingService } from './ranking.service';

const API_URL = environment.apiUrl;
const COMPETITION_ID = 'comp1';

@Injectable({ providedIn: 'root' })
export class MatchdayService {
  private readonly http = inject(HttpClient);
  private readonly ranking = inject(RankingService);

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

    const saturdayNoon = new Date(monday);
    saturdayNoon.setDate(monday.getDate() + 5);
    saturdayNoon.setHours(12, 0, 0, 0);

    if (now < monday) return MatchdayStatus.UPCOMING;
    return now < saturdayNoon ? MatchdayStatus.ACTIVE : MatchdayStatus.LOCKED;
  }

  getActive(): Matchday | undefined {
    return this.matchdays().find((matchday) => this.getStatus(matchday) === MatchdayStatus.ACTIVE);
  }

  submitResult(matchId: string, result: MatchResult, onDone?: (success: boolean) => void): void {
    this.http.put<Match>(`${API_URL}/matches/${matchId}/result`, result).subscribe({
      next: (updatedMatch) => {
        this.matchdays.update((matchdays) =>
          matchdays.map((matchday) => ({
            ...matchday,
            matches: matchday.matches.map((match) => (match.id === matchId ? updatedMatch : match)),
          }))
        );
        this.ranking.loadGlobal();
        onDone?.(true);
      },
      error: (error) => {
        console.error('Impossible de saisir le résultat.', error);
        onDone?.(false);
      },
    });
  }
}
