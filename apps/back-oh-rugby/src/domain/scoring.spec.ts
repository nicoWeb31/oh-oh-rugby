import { describe, expect, it } from 'vitest';
import { Match, Matchday, MatchdayStatus, MatchOutcome, Player, Prediction } from '@org/models';
import { buildRanking, findMatch, getMatchdayStatus, scorePrediction } from './scoring';

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

describe('scorePrediction', () => {
  it('returns 0 when the match has no result yet', () => {
    expect(scorePrediction(makePrediction(), makeMatch())).toBe(0);
  });

  it('returns 0 when the predicted outcome is wrong', () => {
    const match = makeMatch({
      result: { outcome: MatchOutcome.AWAY, offensiveBonusAwarded: false, defensiveBonusAwarded: false },
    });
    expect(scorePrediction(makePrediction({ outcome: MatchOutcome.HOME }), match)).toBe(0);
  });

  it('returns 3 for a correct outcome with no bonus', () => {
    const match = makeMatch({
      result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: false },
    });
    expect(scorePrediction(makePrediction({ outcome: MatchOutcome.HOME }), match)).toBe(3);
  });

  it('adds 1 point per correctly predicted bonus, only when the outcome is correct', () => {
    const match = makeMatch({
      result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: true, defensiveBonusAwarded: true },
    });
    const prediction = makePrediction({
      outcome: MatchOutcome.HOME,
      offensiveBonusPredicted: true,
      defensiveBonusPredicted: true,
    });
    expect(scorePrediction(prediction, match)).toBe(5);
  });

  it('returns 4 for a correct draw prediction with no bonus', () => {
    const match = makeMatch({
      result: { outcome: MatchOutcome.DRAW, offensiveBonusAwarded: false, defensiveBonusAwarded: false },
    });
    expect(scorePrediction(makePrediction({ outcome: MatchOutcome.DRAW }), match)).toBe(4);
  });

  it('does not award bonus points when the outcome prediction is wrong', () => {
    const match = makeMatch({
      result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: true, defensiveBonusAwarded: true },
    });
    const prediction = makePrediction({
      outcome: MatchOutcome.AWAY,
      offensiveBonusPredicted: true,
      defensiveBonusPredicted: true,
    });
    expect(scorePrediction(prediction, match)).toBe(0);
  });
});

describe('getMatchdayStatus', () => {
  const matchday: Matchday = { id: 'md1', label: 'J1', date: '2026-07-05', matches: [] };

  it('is UPCOMING before the Monday of match week', () => {
    expect(getMatchdayStatus({ ...matchday, date: '2099-01-04' })).toBe(MatchdayStatus.UPCOMING);
  });

  it('is LOCKED after Saturday noon of match week', () => {
    expect(getMatchdayStatus({ ...matchday, date: '2000-01-02' })).toBe(MatchdayStatus.LOCKED);
  });
});

describe('findMatch', () => {
  it('locates the matchday owning a given match id', () => {
    const matchdays: Matchday[] = [
      { id: 'md1', label: 'J1', date: '2026-07-05', matches: [makeMatch({ id: 'md1-m1' })] },
      { id: 'md2', label: 'J2', date: '2026-07-12', matches: [makeMatch({ id: 'md2-m1' })] },
    ];
    const found = findMatch(matchdays, 'md2-m1');
    expect(found?.matchday.id).toBe('md2');
    expect(found?.match.id).toBe('md2-m1');
  });

  it('returns undefined when the match does not exist', () => {
    expect(findMatch([], 'unknown')).toBeUndefined();
  });
});

describe('buildRanking', () => {
  it('sorts players by total points and assigns ranks', () => {
    const players: Player[] = [
      { id: 'p1', displayName: 'Thomas' },
      { id: 'p2', displayName: 'Nicolas' },
    ];
    const matchdays: Matchday[] = [
      {
        id: 'md1',
        label: 'J1',
        date: '2026-07-05',
        matches: [
          makeMatch({
            id: 'md1-m1',
            result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: false },
          }),
        ],
      },
    ];
    const predictionsByPlayer = new Map<string, Prediction[]>([
      ['p1', [makePrediction({ playerId: 'p1', outcome: MatchOutcome.HOME })]],
      ['p2', [makePrediction({ playerId: 'p2', outcome: MatchOutcome.AWAY })]],
    ]);

    const ranking = buildRanking(players, matchdays, predictionsByPlayer);

    expect(ranking).toEqual([
      { playerId: 'p1', displayName: 'Thomas', points: 3, rank: 1 },
      { playerId: 'p2', displayName: 'Nicolas', points: 0, rank: 2 },
    ]);
  });

  it('gives a player with no prediction 0 points without excluding them from ranking', () => {
    const players: Player[] = [{ id: 'p1', displayName: 'Thomas' }];
    const matchdays: Matchday[] = [
      {
        id: 'md1',
        label: 'J1',
        date: '2026-07-05',
        matches: [
          makeMatch({
            id: 'md1-m1',
            result: { outcome: MatchOutcome.HOME, offensiveBonusAwarded: false, defensiveBonusAwarded: false },
          }),
        ],
      },
    ];

    const ranking = buildRanking(players, matchdays, new Map());

    expect(ranking).toEqual([{ playerId: 'p1', displayName: 'Thomas', points: 0, rank: 1 }]);
  });
});
