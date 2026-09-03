import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Prediction } from '@org/models';
import { RankingService } from './ranking.service';
import { PlayerService } from './player.service';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private readonly http = inject(HttpClient);
  private readonly ranking = inject(RankingService);
  private readonly playerService = inject(PlayerService);
  private readonly store = signal<Prediction[]>([]);

  loadForMatchday(playerId: string, matchdayId: string): void {
    this.http
      .get<Prediction[]>(`${API_URL}/predictions`, {
        params: { playerId, matchdayId },
      })
      .subscribe({
        next: (predictions) => {
          const returnedMatchIds = new Set(
            predictions.map((prediction) => prediction.matchId),
          );
          this.store.update((stored) => [
            ...stored.filter(
              (prediction) =>
                prediction.playerId !== playerId ||
                !returnedMatchIds.has(prediction.matchId),
            ),
            ...predictions,
          ]);
        },
        error: (error) =>
          console.error('Impossible de charger les pronostics.', error),
      });
  }

  getForPlayerAndMatch(
    playerId: string,
    matchId: string,
  ): Prediction | undefined {
    return this.store().find(
      (prediction) =>
        prediction.playerId === playerId && prediction.matchId === matchId,
    );
  }

  save(prediction: Prediction): void {
    const { matchId, ...payload } = prediction;
    const code = this.playerService.getCode();
    this.http
      .put<Prediction>(`${API_URL}/predictions/${matchId}`, {
        ...payload,
        code,
      })
      .subscribe({
        next: (savedPrediction) => {
          this.store.update((stored) => {
            const index = stored.findIndex(
              (candidate) =>
                candidate.playerId === savedPrediction.playerId &&
                candidate.matchId === savedPrediction.matchId,
            );
            if (index === -1) return [...stored, savedPrediction];
            return stored.map((candidate, candidateIndex) =>
              candidateIndex === index ? savedPrediction : candidate,
            );
          });
          this.ranking.loadGlobal();
        },
        error: (error) =>
          console.error('Impossible de sauvegarder le pronostic.', error),
      });
  }
}
