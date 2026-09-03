import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { MatchdayStatus, MatchOutcome, Prediction } from '@org/models';
import * as competitionRepository from './repositories/competition.repository';
import * as matchdayRepository from './repositories/matchday.repository';
import * as playerRepository from './repositories/player.repository';
import * as predictionRepository from './repositories/prediction.repository';
import { buildRanking, getMatchdayStatus } from './domain/scoring';
import { matchdayIdFromMatchId } from './dynamodb/keys';

function requireString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function createApp() {
  const app = express();
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim());

  app.use(express.json());
  app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/competitions/:id', async (req, res, next) => {
    try {
      const competition = await competitionRepository.getCompetition(req.params.id);
      if (!competition) {
        res.status(404).json({ message: 'Competition introuvable.' });
        return;
      }
      res.json(competition);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/matchdays', async (req, res, next) => {
    try {
      const competitionId = typeof req.query.competitionId === 'string' ? req.query.competitionId : undefined;
      if (!competitionId) {
        res.status(400).json({ message: 'Le paramètre competitionId est requis.' });
        return;
      }
      const competition = await competitionRepository.getCompetition(competitionId);
      if (!competition) {
        res.status(404).json({ message: 'Competition introuvable.' });
        return;
      }
      res.json(await matchdayRepository.getMatchdaysByIds(competition.matchdayIds));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/matchdays/:id', async (req, res, next) => {
    try {
      const matchday = await matchdayRepository.getMatchdayById(req.params.id);
      if (!matchday) {
        res.status(404).json({ message: 'Journée introuvable.' });
        return;
      }
      res.json(matchday);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/players', async (_req, res, next) => {
    try {
      res.json(await playerRepository.listPlayers());
    } catch (error) {
      next(error);
    }
  });

  // Lightweight deterrent against playing as someone else, not real auth
  // (static codes shared by word of mouth). Used by the frontend's login
  // screen for immediate feedback; the same check is re-applied server-side
  // on every write that matters (see PUT /api/predictions/:matchId).
  app.post('/api/auth/verify', async (req, res, next) => {
    try {
      const playerId = requireString(req.body?.playerId);
      const code = requireString(req.body?.code);
      if (!playerId || !code) {
        res.status(400).json({ message: 'playerId et code sont requis.' });
        return;
      }
      if (!(await playerRepository.verifyCode(playerId, code))) {
        res.status(401).json({ message: 'Code invalide.' });
        return;
      }
      const player = await playerRepository.getPlayer(playerId);
      res.json(player);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/predictions', async (req, res, next) => {
    try {
      const playerId = typeof req.query.playerId === 'string' ? req.query.playerId : undefined;
      const matchdayId = typeof req.query.matchdayId === 'string' ? req.query.matchdayId : undefined;

      if (!playerId) {
        res.status(400).json({ message: 'Le paramètre playerId est requis.' });
        return;
      }
      if (!(await playerRepository.getPlayer(playerId))) {
        res.status(404).json({ message: 'Joueur introuvable.' });
        return;
      }

      let predictions = await predictionRepository.getPredictionsByPlayer(playerId);
      if (matchdayId) {
        const matchday = await matchdayRepository.getMatchdayById(matchdayId);
        if (!matchday) {
          res.status(404).json({ message: 'Journée introuvable.' });
          return;
        }
        const matchIds = new Set(matchday.matches.map((match) => match.id));
        predictions = predictions.filter((prediction) => matchIds.has(prediction.matchId));
      }
      res.json(predictions);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/predictions/:matchId', async (req, res, next) => {
    try {
      const playerId = requireString(req.body?.playerId);
      const code = requireString(req.body?.code);
      const outcome = req.body?.outcome;
      const offensiveBonusPredicted = req.body?.offensiveBonusPredicted;
      const defensiveBonusPredicted = req.body?.defensiveBonusPredicted;

      if (!playerId || !(await playerRepository.getPlayer(playerId))) {
        res.status(400).json({ message: 'Le joueur est invalide.' });
        return;
      }
      if (!code || !(await playerRepository.verifyCode(playerId, code))) {
        res.status(401).json({ message: 'Code invalide.' });
        return;
      }

      const matchday = await matchdayRepository.getMatchdayById(matchdayIdFromMatchId(req.params.matchId));
      const match = matchday?.matches.find((candidate) => candidate.id === req.params.matchId);
      if (!matchday || !match) {
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
      if (getMatchdayStatus(matchday) !== MatchdayStatus.ACTIVE) {
        res.status(409).json({ message: 'Les pronostics sont verrouillés pour cette journée.' });
        return;
      }

      const prediction: Prediction = {
        id: `pred-${playerId}-${match.id}`,
        playerId,
        matchId: match.id,
        outcome,
        offensiveBonusPredicted,
        defensiveBonusPredicted,
      };
      await predictionRepository.putPrediction(prediction);
      res.json(prediction);
    } catch (error) {
      next(error);
    }
  });

  // No auth on this route: consistent with the rest of the MVP (no auth
  // anywhere yet). Anyone with the app URL can record a match result.
  app.put('/api/matches/:matchId/result', async (req, res, next) => {
    try {
      const outcome = req.body?.outcome;
      const offensiveBonusAwarded = req.body?.offensiveBonusAwarded;
      const defensiveBonusAwarded = req.body?.defensiveBonusAwarded;

      if (!Object.values(MatchOutcome).includes(outcome)) {
        res.status(400).json({ message: 'Le résultat est invalide.' });
        return;
      }
      if (typeof offensiveBonusAwarded !== 'boolean' || typeof defensiveBonusAwarded !== 'boolean') {
        res.status(400).json({ message: 'Les bonus doivent être des booléens.' });
        return;
      }

      const matchday = await matchdayRepository.getMatchdayById(matchdayIdFromMatchId(req.params.matchId));
      const match = matchday?.matches.find((candidate) => candidate.id === req.params.matchId);
      if (!matchday || !match) {
        res.status(404).json({ message: 'Match introuvable.' });
        return;
      }

      match.result = { outcome, offensiveBonusAwarded, defensiveBonusAwarded };
      await matchdayRepository.putMatchday(matchday);
      res.json(match);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/ranking', async (req, res, next) => {
    try {
      const competitionId = typeof req.query.competitionId === 'string' ? req.query.competitionId : undefined;
      const matchdayId = typeof req.query.matchdayId === 'string' ? req.query.matchdayId : undefined;

      if (!competitionId) {
        res.status(400).json({ message: 'Le paramètre competitionId est requis.' });
        return;
      }
      const competition = await competitionRepository.getCompetition(competitionId);
      if (!competition) {
        res.status(404).json({ message: 'Competition introuvable.' });
        return;
      }

      const players = await playerRepository.listPlayers();
      let matchdaysToScore = await matchdayRepository.getMatchdaysByIds(competition.matchdayIds);
      if (matchdayId) {
        const matchday = matchdaysToScore.find((candidate) => candidate.id === matchdayId);
        if (!matchday) {
          res.status(404).json({ message: 'Journée introuvable.' });
          return;
        }
        matchdaysToScore = [matchday];
      }

      const predictionsByPlayer = new Map(
        await Promise.all(
          players.map(
            async (player) => [player.id, await predictionRepository.getPredictionsByPlayer(player.id)] as const
          )
        )
      );
      res.json(buildRanking(players, matchdaysToScore, predictionsByPlayer));
    } catch (error) {
      next(error);
    }
  });

  // Express identifies error-handling middleware by its 4-arg arity, so `next`
  // must stay in the signature even though it's never called here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  });

  return app;
}
