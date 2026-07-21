import { Injectable } from '@angular/core';
import { Matchday, RankingEntry } from '@org/models';
import { MOCK_PLAYERS } from '../mocks/players.mock';
import { PredictionService } from './prediction.service';
import { ScoringService } from './scoring.service';

@Injectable({ providedIn: 'root' })
export class RankingService {
  constructor(
    private predictions: PredictionService,
    private scoring: ScoringService
  ) {}

  getGlobal(matchdays: Matchday[]): RankingEntry[] {
    return this.rank(
      MOCK_PLAYERS.map((player) => {
        const points = matchdays.reduce((total, md) => {
          const matchIds = md.matches.map((m) => m.id);
          const preds = this.predictions.getForMatchday(player.id, md.id, matchIds);
          const mdPoints = md.matches.reduce((sum, match) => {
            const pred = preds.find((p) => p.matchId === match.id);
            return sum + (pred ? this.scoring.scoreMatch(pred, match) : 0);
          }, 0);
          return total + mdPoints;
        }, 0);
        return { playerId: player.id, displayName: player.displayName, points, rank: 0 };
      })
    );
  }

  getForMatchday(matchday: Matchday): RankingEntry[] {
    const matchIds = matchday.matches.map((m) => m.id);
    return this.rank(
      MOCK_PLAYERS.map((player) => {
        const preds = this.predictions.getForMatchday(player.id, matchday.id, matchIds);
        const points = matchday.matches.reduce((sum, match) => {
          const pred = preds.find((p) => p.matchId === match.id);
          return sum + (pred ? this.scoring.scoreMatch(pred, match) : 0);
        }, 0);
        return { playerId: player.id, displayName: player.displayName, points, rank: 0 };
      })
    );
  }

  private rank(entries: RankingEntry[]): RankingEntry[] {
    return entries
      .sort((a, b) => b.points - a.points)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }
}
