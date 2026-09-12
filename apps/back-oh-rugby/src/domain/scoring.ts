import {
  Match,
  Matchday,
  MatchdayStatus,
  MatchOutcome,
  Player,
  Prediction,
  RankingEntry,
} from '@org/models';

export function getMatchdayStatus(matchday: Matchday): MatchdayStatus {
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

export function findMatch(
  matchdays: Matchday[],
  matchId: string,
): { matchday: Matchday; match: Match } | undefined {
  for (const matchday of matchdays) {
    const match = matchday.matches.find(
      (candidate) => candidate.id === matchId,
    );
    if (match) return { matchday, match };
  }
  return undefined;
}

export function scorePrediction(prediction: Prediction, match: Match): number {
  if (!match.result || prediction.outcome !== match.result.outcome) return 0;

  const outcomePoints = match.result.outcome === MatchOutcome.DRAW ? 4 : 3;
  return (
    outcomePoints +
    Number(
      prediction.offensiveBonusPredicted ===
        match.result.offensiveBonusAwarded,
    ) +
    Number(
      prediction.defensiveBonusPredicted ===
        match.result.defensiveBonusAwarded,
    )
  );
}

export function buildRanking(
  players: Player[],
  matchdaysToScore: Matchday[],
  predictionsByPlayer: Map<string, Prediction[]>,
): RankingEntry[] {
  return players
    .map((player) => {
      const predictions = predictionsByPlayer.get(player.id) ?? [];
      const points = matchdaysToScore.reduce((total, matchday) => {
        return (
          total +
          matchday.matches.reduce((matchdayTotal, match) => {
            const prediction = predictions.find(
              (candidate) => candidate.matchId === match.id,
            );
            return (
              matchdayTotal +
              (prediction ? scorePrediction(prediction, match) : 0)
            );
          }, 0)
        );
      }, 0);

      return {
        playerId: player.id,
        displayName: player.displayName,
        points,
        rank: 0,
      };
    })
    .sort((first, second) => second.points - first.points)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
