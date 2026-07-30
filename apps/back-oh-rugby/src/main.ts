import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import {
  Competition,
  Match,
  Matchday,
  MatchdayStatus,
  MatchOutcome,
  Player,
  Prediction,
  RankingEntry,
} from '@org/models';
import { MOCK_COMPETITION, MOCK_MATCHDAYS } from './data/matchdays.seed';
import { MOCK_PLAYERS } from './data/players.seed';
import { MOCK_PREDICTIONS } from './data/predictions.seed';

const competition: Competition = MOCK_COMPETITION;
const matchdays: Matchday[] = MOCK_MATCHDAYS;
const players: Player[] = MOCK_PLAYERS;
let predictions: Prediction[] = [...MOCK_PREDICTIONS];

function getMatchdayStatus(matchday: Matchday): MatchdayStatus {
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

function findMatch(matchId: string): { matchday: Matchday; match: Match } | undefined {
  for (const matchday of matchdays) {
    const match = matchday.matches.find((candidate) => candidate.id === matchId);
    if (match) return { matchday, match };
  }
  return undefined;
}

function scorePrediction(prediction: Prediction, match: Match): number {
  if (!match.result || prediction.outcome !== match.result.outcome) return 0;

  return (
    3 +
    Number(prediction.offensiveBonusPredicted && match.result.offensiveBonusAwarded) +
    Number(prediction.defensiveBonusPredicted && match.result.defensiveBonusAwarded)
  );
}

function buildRanking(matchdaysToScore: Matchday[]): RankingEntry[] {
  return players
    .map((player) => {
      const points = matchdaysToScore.reduce((total, matchday) => {
        return total + matchday.matches.reduce((matchdayTotal, match) => {
          const prediction = predictions.find(
            (candidate) => candidate.playerId === player.id && candidate.matchId === match.id
          );
          return matchdayTotal + (prediction ? scorePrediction(prediction, match) : 0);
        }, 0);
      }, 0);

      return { playerId: player.id, displayName: player.displayName, points, rank: 0 };
    })
    .sort((first, second) => second.points - first.points)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function requireString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim());

export const app = express();

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api', (_req, res) => {
  res.json({ message: 'Welcome to back-oh-rugby!' });
});

app.get('/api/competitions/:id', (req, res) => {
  if (req.params.id !== competition.id) {
    res.status(404).json({ message: 'Competition introuvable.' });
    return;
  }
  res.json(competition);
});

app.get('/api/matchdays', (req, res) => {
  const competitionId = typeof req.query.competitionId === 'string' ? req.query.competitionId : undefined;
  if (competitionId && competitionId !== competition.id) {
    res.status(404).json({ message: 'Competition introuvable.' });
    return;
  }
  res.json(matchdays);
});

app.get('/api/matchdays/:id', (req, res) => {
  const matchday = matchdays.find((candidate) => candidate.id === req.params.id);
  if (!matchday) {
    res.status(404).json({ message: 'Journée introuvable.' });
    return;
  }
  res.json(matchday);
});

app.get('/api/players', (_req, res) => {
  res.json(players);
});

app.get('/api/predictions', (req, res) => {
  const playerId = typeof req.query.playerId === 'string' ? req.query.playerId : undefined;
  const matchdayId = typeof req.query.matchdayId === 'string' ? req.query.matchdayId : undefined;

  if (!playerId) {
    res.status(400).json({ message: 'Le paramètre playerId est requis.' });
    return;
  }
  if (!players.some((player) => player.id === playerId)) {
    res.status(404).json({ message: 'Joueur introuvable.' });
    return;
  }

  let playerPredictions = predictions.filter((prediction) => prediction.playerId === playerId);
  if (matchdayId) {
    const matchday = matchdays.find((candidate) => candidate.id === matchdayId);
    if (!matchday) {
      res.status(404).json({ message: 'Journée introuvable.' });
      return;
    }
    const matchIds = new Set(matchday.matches.map((match) => match.id));
    playerPredictions = playerPredictions.filter((prediction) => matchIds.has(prediction.matchId));
  }
  res.json(playerPredictions);
});

app.put('/api/predictions/:matchId', (req, res) => {
  const playerId = requireString(req.body?.playerId);
  const outcome = req.body?.outcome;
  const offensiveBonusPredicted = req.body?.offensiveBonusPredicted;
  const defensiveBonusPredicted = req.body?.defensiveBonusPredicted;
  const fixture = findMatch(req.params.matchId);

  if (!playerId || !players.some((player) => player.id === playerId)) {
    res.status(400).json({ message: 'Le joueur est invalide.' });
    return;
  }
  if (!fixture) {
    res.status(404).json({ message: 'Match introuvable.' });
    return;
  }
  if (!Object.values(MatchOutcome).includes(outcome)) {
    res.status(400).json({ message: 'Le pronostic est invalide.' });
    return;
  }
  if (typeof offensiveBonusPredicted !== 'boolean' || typeof defensiveBonusPredicted !== 'boolean') {
    res.status(400).json({ message: 'Les bonus doivent être des booléens.' });
    return;
  }
  if (getMatchdayStatus(fixture.matchday) !== MatchdayStatus.ACTIVE) {
    res.status(409).json({ message: 'Les pronostics sont verrouillés pour cette journée.' });
    return;
  }

  const prediction: Prediction = {
    id: `pred-${playerId}-${fixture.match.id}`,
    playerId,
    matchId: fixture.match.id,
    outcome,
    offensiveBonusPredicted,
    defensiveBonusPredicted,
  };
  const index = predictions.findIndex(
    (candidate) => candidate.playerId === playerId && candidate.matchId === fixture.match.id
  );
  predictions = index === -1
    ? [...predictions, prediction]
    : predictions.map((candidate, candidateIndex) => candidateIndex === index ? prediction : candidate);

  res.json(prediction);
});

app.get('/api/ranking', (req, res) => {
  const competitionId = typeof req.query.competitionId === 'string' ? req.query.competitionId : undefined;
  const matchdayId = typeof req.query.matchdayId === 'string' ? req.query.matchdayId : undefined;

  if (competitionId && competitionId !== competition.id) {
    res.status(404).json({ message: 'Competition introuvable.' });
    return;
  }
  if (matchdayId) {
    const matchday = matchdays.find((candidate) => candidate.id === matchdayId);
    if (!matchday) {
      res.status(404).json({ message: 'Journée introuvable.' });
      return;
    }
    res.json(buildRanking([matchday]));
    return;
  }
  res.json(buildRanking(matchdays));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'Une erreur interne est survenue.' });
});

export const handler = serverless(app);

if (require.main === module) {
  const port = Number(process.env.PORT) || 3333;
  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
  });
}
