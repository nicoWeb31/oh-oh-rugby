import { MatchOutcome, Prediction } from '@org/models';

// Pronostics de Thomas (p1) — bon joueur
const P1_PREDICTIONS: Prediction[] = [
  // J1
  { id: 'pred-p1-md1-m1', playerId: 'p1', matchId: 'md1-m1', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md1-m2', playerId: 'p1', matchId: 'md1-m2', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p1-md1-m3', playerId: 'p1', matchId: 'md1-m3', outcome: MatchOutcome.DRAW, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md1-m4', playerId: 'p1', matchId: 'md1-m4', outcome: MatchOutcome.HOME, offensiveBonusPredicted: true,  defensiveBonusPredicted: false }, // ✓ 4pts
  { id: 'pred-p1-md1-m5', playerId: 'p1', matchId: 'md1-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p1-md1-m6', playerId: 'p1', matchId: 'md1-m6', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p1-md1-m7', playerId: 'p1', matchId: 'md1-m7', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  // J2
  { id: 'pred-p1-md2-m1', playerId: 'p1', matchId: 'md2-m1', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md2-m2', playerId: 'p1', matchId: 'md2-m2', outcome: MatchOutcome.DRAW, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md2-m3', playerId: 'p1', matchId: 'md2-m3', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p1-md2-m4', playerId: 'p1', matchId: 'md2-m4', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md2-m5', playerId: 'p1', matchId: 'md2-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p1-md2-m6', playerId: 'p1', matchId: 'md2-m6', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p1-md2-m7', playerId: 'p1', matchId: 'md2-m7', outcome: MatchOutcome.HOME, offensiveBonusPredicted: true,  defensiveBonusPredicted: false }, // ✓ 4pts
  // J3
  { id: 'pred-p1-md3-m1', playerId: 'p1', matchId: 'md3-m1', outcome: MatchOutcome.DRAW, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md3-m2', playerId: 'p1', matchId: 'md3-m2', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md3-m3', playerId: 'p1', matchId: 'md3-m3', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: true,  defensiveBonusPredicted: false }, // ✓ 4pts
  { id: 'pred-p1-md3-m4', playerId: 'p1', matchId: 'md3-m4', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p1-md3-m5', playerId: 'p1', matchId: 'md3-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p1-md3-m6', playerId: 'p1', matchId: 'md3-m6', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p1-md3-m7', playerId: 'p1', matchId: 'md3-m7', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
];

// Pronostics de Nicolas (p2) — joueur moyen
const P2_PREDICTIONS: Prediction[] = [
  // J1
  { id: 'pred-p2-md1-m1', playerId: 'p2', matchId: 'md1-m1', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md1-m2', playerId: 'p2', matchId: 'md1-m2', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md1-m3', playerId: 'p2', matchId: 'md1-m3', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p2-md1-m4', playerId: 'p2', matchId: 'md1-m4', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md1-m5', playerId: 'p2', matchId: 'md1-m5', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p2-md1-m6', playerId: 'p2', matchId: 'md1-m6', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md1-m7', playerId: 'p2', matchId: 'md1-m7', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  // J2
  { id: 'pred-p2-md2-m1', playerId: 'p2', matchId: 'md2-m1', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md2-m2', playerId: 'p2', matchId: 'md2-m2', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p2-md2-m3', playerId: 'p2', matchId: 'md2-m3', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md2-m4', playerId: 'p2', matchId: 'md2-m4', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p2-md2-m5', playerId: 'p2', matchId: 'md2-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md2-m6', playerId: 'p2', matchId: 'md2-m6', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md2-m7', playerId: 'p2', matchId: 'md2-m7', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  // J3
  { id: 'pred-p2-md3-m1', playerId: 'p2', matchId: 'md3-m1', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p2-md3-m2', playerId: 'p2', matchId: 'md3-m2', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md3-m3', playerId: 'p2', matchId: 'md3-m3', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p2-md3-m4', playerId: 'p2', matchId: 'md3-m4', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md3-m5', playerId: 'p2', matchId: 'md3-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md3-m6', playerId: 'p2', matchId: 'md3-m6', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p2-md3-m7', playerId: 'p2', matchId: 'md3-m7', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
];

// Pronostics de Marjory (p3) — meilleure joueuse
const P3_PREDICTIONS: Prediction[] = [
  // J1
  { id: 'pred-p3-md1-m1', playerId: 'p3', matchId: 'md1-m1', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md1-m2', playerId: 'p3', matchId: 'md1-m2', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md1-m3', playerId: 'p3', matchId: 'md1-m3', outcome: MatchOutcome.DRAW, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md1-m4', playerId: 'p3', matchId: 'md1-m4', outcome: MatchOutcome.HOME, offensiveBonusPredicted: true,  defensiveBonusPredicted: false }, // ✓ 4pts
  { id: 'pred-p3-md1-m5', playerId: 'p3', matchId: 'md1-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md1-m6', playerId: 'p3', matchId: 'md1-m6', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md1-m7', playerId: 'p3', matchId: 'md1-m7', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  // J2
  { id: 'pred-p3-md2-m1', playerId: 'p3', matchId: 'md2-m1', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✗ 0pts
  { id: 'pred-p3-md2-m2', playerId: 'p3', matchId: 'md2-m2', outcome: MatchOutcome.DRAW, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md2-m3', playerId: 'p3', matchId: 'md2-m3', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p3-md2-m4', playerId: 'p3', matchId: 'md2-m4', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md2-m5', playerId: 'p3', matchId: 'md2-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md2-m6', playerId: 'p3', matchId: 'md2-m6', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p3-md2-m7', playerId: 'p3', matchId: 'md2-m7', outcome: MatchOutcome.HOME, offensiveBonusPredicted: true,  defensiveBonusPredicted: false }, // ✓ 4pts
  // J3
  { id: 'pred-p3-md3-m1', playerId: 'p3', matchId: 'md3-m1', outcome: MatchOutcome.DRAW, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md3-m2', playerId: 'p3', matchId: 'md3-m2', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: true  }, // ✓ 4pts
  { id: 'pred-p3-md3-m3', playerId: 'p3', matchId: 'md3-m3', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: true,  defensiveBonusPredicted: false }, // ✓ 4pts
  { id: 'pred-p3-md3-m4', playerId: 'p3', matchId: 'md3-m4', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md3-m5', playerId: 'p3', matchId: 'md3-m5', outcome: MatchOutcome.HOME, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md3-m6', playerId: 'p3', matchId: 'md3-m6', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
  { id: 'pred-p3-md3-m7', playerId: 'p3', matchId: 'md3-m7', outcome: MatchOutcome.AWAY, offensiveBonusPredicted: false, defensiveBonusPredicted: false }, // ✓ 3pts
];

export const MOCK_PREDICTIONS: Prediction[] = [
  ...P1_PREDICTIONS,
  ...P2_PREDICTIONS,
  ...P3_PREDICTIONS,
];
