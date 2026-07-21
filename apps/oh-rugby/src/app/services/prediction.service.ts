import { Injectable, signal } from '@angular/core';
import { Prediction } from '@org/models';
import { MOCK_PREDICTIONS } from '../mocks/predictions.mock';

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private readonly store = signal<Prediction[]>([...MOCK_PREDICTIONS]);

  getForPlayer(playerId: string): Prediction[] {
    return this.store().filter((p) => p.playerId === playerId);
  }

  getForPlayerAndMatch(playerId: string, matchId: string): Prediction | undefined {
    return this.store().find(
      (p) => p.playerId === playerId && p.matchId === matchId
    );
  }

  getForMatchday(playerId: string, matchdayId: string, matchIds: string[]): Prediction[] {
    return this.store().filter(
      (p) => p.playerId === playerId && matchIds.includes(p.matchId)
    );
  }

  save(prediction: Prediction): void {
    this.store.update((list) => {
      const idx = list.findIndex(
        (p) => p.playerId === prediction.playerId && p.matchId === prediction.matchId
      );
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = prediction;
        return updated;
      }
      return [...list, prediction];
    });
  }
}
