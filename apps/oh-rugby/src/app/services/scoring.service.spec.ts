import { describe, expect, it } from 'vitest';
import { Match, MatchOutcome, Prediction } from '@org/models';
import { ScoringService } from './scoring.service';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'md1-m1',
    homeTeam: 'Bayonne',
    awayTeam: 'Toulon',
    scheduledAt: '2026-07-05',
    ...overrides,
  };
}

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'pred-p1-md1-m1',
    playerId: 'p1',
    matchId: 'md1-m1',
    outcome: MatchOutcome.HOME,
    offensiveBonusPredicted: false,
    defensiveBonusPredicted: false,
    ...overrides,
  };
}

describe('ScoringService', () => {
  const service = new ScoringService();

  it('returns 0 when the match has no result yet', () => {
    expect(service.scoreMatch(makePrediction(), makeMatch())).toBe(0);
  });

  it('returns 0 when the predicted outcome is wrong', () => {
    const match = makeMatch({
      result: {
        outcome: MatchOutcome.AWAY,
        offensiveBonusAwarded: false,
        defensiveBonusAwarded: false,
      },
    });
    expect(
      service.scoreMatch(makePrediction({ outcome: MatchOutcome.HOME }), match),
    ).toBe(0);
  });

  it('returns 3 for a correct outcome with no bonus', () => {
    const match = makeMatch({
      result: {
        outcome: MatchOutcome.HOME,
        offensiveBonusAwarded: false,
        defensiveBonusAwarded: false,
      },
    });
    expect(
      service.scoreMatch(makePrediction({ outcome: MatchOutcome.HOME }), match),
    ).toBe(3);
  });

  it('returns 4 for a correct draw prediction with no bonus', () => {
    const match = makeMatch({
      result: {
        outcome: MatchOutcome.DRAW,
        offensiveBonusAwarded: false,
        defensiveBonusAwarded: false,
      },
    });
    expect(
      service.scoreMatch(makePrediction({ outcome: MatchOutcome.DRAW }), match),
    ).toBe(4);
  });

  it('adds 1 point per correctly predicted bonus, only when the outcome is correct', () => {
    const match = makeMatch({
      result: {
        outcome: MatchOutcome.HOME,
        offensiveBonusAwarded: true,
        defensiveBonusAwarded: true,
      },
    });
    const prediction = makePrediction({
      outcome: MatchOutcome.HOME,
      offensiveBonusPredicted: true,
      defensiveBonusPredicted: true,
    });
    expect(service.scoreMatch(prediction, match)).toBe(5);
  });
});
