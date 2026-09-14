import { Injectable } from '@angular/core';
import { Match, MatchOutcome, Prediction } from '@org/models';

@Injectable({ providedIn: 'root' })
export class ScoringService {
  scoreMatch(prediction: Prediction, match: Match): number {
    if (!match.result) return 0;
    if (prediction.outcome !== match.result.outcome) return 0;

    let points = match.result.outcome === MatchOutcome.DRAW ? 4 : 3;
    if (
      prediction.offensiveBonusPredicted === match.result.offensiveBonusAwarded
    )
      points += 1;
    if (
      prediction.defensiveBonusPredicted === match.result.defensiveBonusAwarded
    )
      points += 1;
    return points;
  }
}
