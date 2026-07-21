# OhRugby Product Spec

## Objectif

Construire une application de pronostics autour de matchs de rugby.

Le principe de base :

- des joueurs participent à une compétition de pronostics ;
- une compétition peut couvrir une ou plusieurs journées de championnat ;
- pour chaque journée, les joueurs saisissent leurs pronostics match par match ;
- un classement est calculé à partir des points gagnés sur chaque pronostic.

Le projet peut démarrer côté front avec des données mockées. L'architecture backend et la persistance seront définies plus tard.

## Vision Produit

L'application doit permettre de :

- consulter le calendrier des journées ;
- choisir une journée active ;
- saisir un pronostic pour chaque match de la journée ;
- visualiser les pronostics déjà saisis ;
- afficher un classement des joueurs basé sur les points ;
- faire évoluer plus tard les pronostics en ajoutant les scores exacts.

## Hypothèses Actuelles

- Le sport ciblé est le rugby.
- Les matchs sont organisés par journée.
- Un joueur pronostique chaque match d'une journée.
- Les scores exacts ne sont pas encore saisis dans la première version fonctionnelle.
- La logique de points suit les règles du TOP 14.
- La journée active correspond à la fenêtre pendant laquelle les pronostics sont autorisés.

## Règles Métier Confirmées

## 1. Format de la compétition

- Le TOP 14 réunit 14 clubs professionnels.
- Le championnat se joue en aller-retour.
- La saison régulière contient 26 journées.
- Chaque équipe joue 13 matchs à domicile et 13 matchs à l'extérieur.
- La compétition produit couvre plusieurs journées.

## 2. Journée active

- Les matchs d'une journée sont joués le week-end.
- Une journée devient active le lundi matin de la semaine de ses matchs.
- Une journée cesse d'être active le vendredi soir de la date de ses matchs.
- Un pronostic ne peut être saisi ou modifié que pendant cette fenêtre active.
- En dehors de cette période, la journée est visible mais verrouillée pour la saisie.
- Pendant la période active, un joueur peut modifier ses pronostics autant de fois qu'il le souhaite.

## 3. Scoring réel d'un match

Le système de points réel du TOP 14 est le suivant :

- 4 points pour une victoire ;
- 2 points pour un match nul ;
- 0 point pour une défaite ;
- 1 point de bonus offensif si une équipe inscrit au moins 3 essais de plus que son adversaire ;
- 1 point de bonus défensif si une équipe perd avec 5 points d'écart ou moins.

## Questions Métier Ouvertes

- Le barème exact de points du jeu de pronostics reste à définir.
- Le niveau de détail de la saisie UI pour les bonus reste à préciser.

## Fonctionnalités V1

## 1. Calendrier

- afficher la liste des journées ;
- afficher les matchs de chaque journée ;
- permettre de naviguer d'une journée à l'autre.

## 2. Pronostics

- un joueur sélectionne une journée ;
- il renseigne son pronostic pour chaque match ;
- il ne peut pronostiquer que si la journée est active ;
- dans un premier temps, le pronostic peut être limité à l'issue du match :
  - victoire équipe domicile ;
  - match nul ;
  - victoire équipe extérieure ;
- le pronostic inclut aussi les bonus offensif et défensif ;
- si un joueur ne saisit pas de pronostic sur un match, il marque `0` point pour ce match ;
- un joueur est quand même classé même s'il n'a pas pronostiqué tous les matchs.

## 3. Classement

- calculer les points d'un joueur selon les règles métier ;
- afficher un classement ordonné par total de points ;
- mettre à jour le classement au fil des résultats saisis ou importés ;
- afficher un classement par journée ;
- afficher un classement global cumulé.

## Hors Périmètre Immédiat

- authentification réelle ;
- gestion d'administration complète ;
- saisie des scores exacts ;
- import automatique de résultats officiels ;
- pipeline CI/CD automatisé (déploiements manuels dans un premier temps).

## Proposition de Modèle Front Mocké

Pour démarrer le front sans figer le backend, on peut mocker les entités suivantes :

- `Competition`
  - `id`
  - `name`
  - `matchdayIds`
  - `status`

- `Matchday`
  - `id`
  - `label`
  - `date`
  - `matches`

- `Match`
  - `id`
  - `homeTeam`
  - `awayTeam`
  - `scheduledAt`
  - `status`

- `Player`
  - `id`
  - `displayName`

- `Prediction`
  - `id`
  - `playerId`
  - `matchId`
  - `outcome`
  - `homeOffensiveBonusPredicted`
  - `awayOffensiveBonusPredicted`
  - `homeDefensiveBonusPredicted`
  - `awayDefensiveBonusPredicted`

- `RankingEntry`
  - `playerId`
  - `points`
  - `rank`

## Barème de Scoring des Pronostics

| Pronostic | Points |
|---|---|
| Issue correcte (domicile / nul / extérieur) | 3 pts |
| Bonus offensif correctement prévu | 1 pt |
| Bonus défensif correctement prévu | 1 pt |

- Maximum par match : **5 pts**
- Un pronostic non saisi vaut **0 pt** pour ce match
- Les bonus ne rapportent des points que si l'issue est également correcte

> Score exact non pris en compte en V1 — prévu pour une itération ultérieure.

## UX Cible V1

### Direction artistique — style vintage jeu vidéo (référence : Jonah Lomu Rugby, 1997)

- typographie bold, pixelisée ou condensée — esprit arcade ;
- palette de couleurs saturées, contrastées, peu de nuances ;
- UI dense et directe : pas de blancs excessifs, tout visible d'un coup d'œil ;
- icônes simples et iconiques (maillot, ballon, score) plutôt que des illustrations ;
- animations légères style "score qui s'affiche" plutôt que transitions fluides ;
- classement affiché comme un tableau de scores d'arcade.

### Structure des écrans

- page d'accueil ou dashboard avec la compétition active ;
- liste ou tabs des journées ;
- vue détail d'une journée avec tous les matchs ;
- formulaire de pronostics simple et rapide à remplir ;
- indication claire de l'état de la journée :
  - à venir ;
  - active ;
  - verrouillée ;
- écran de classement lisible sur mobile, style leaderboard arcade.

## Architecture Technique

### Vue d'ensemble

```
[Navigateur]
     │
     ▼
[Angular – S3 + CloudFront]
     │  HTTP/REST
     ▼
[API Gateway]
     │
     ▼
[AWS Lambda – Express (handler)]
     │
     ▼
[DynamoDB]
```

### Frontend — Angular sur S3

- Application : `apps/oh-rugby` (Angular, déjà créé)
- Build : `pnpm nx build oh-rugby --configuration=production` → `dist/apps/oh-rugby/browser/`
- Déploiement : bucket S3 en mode site statique, distribué via CloudFront
- Routing SPA : rediriger les 404 vers `index.html` (règle d'erreur CloudFront ou S3)
- Variables d'environnement : l'URL de l'API est injectée au build via `environment.ts`

### Backend — Express sur AWS Lambda

- Application : `apps/back-oh-rugby` (Express, déjà créé)
- Le serveur Express est wrappé avec `aws-serverless-express` (ou `@vendia/serverless-express`) pour être exposé comme handler Lambda
- Point d'entrée Lambda : `handler` exporté depuis `src/main.ts` (en plus du `app.listen` local pour le dev)
- Build : `pnpm nx build back-oh-rugby --configuration=production` → `dist/apps/back-oh-rugby/`
- Déploiement : fonction Lambda Node.js 20.x, exposée via API Gateway HTTP API (v2)
- CORS : configuré dans Express pour autoriser l'origine du bucket CloudFront

### Base de données — DynamoDB

- Table principale : `oh-rugby-{env}` (single-table design)
- Clé de partition (`PK`) et clé de tri (`SK`) selon le pattern suivant :

| Entité | PK | SK |
|---|---|---|
| Competition | `COMP#{id}` | `META` |
| Matchday | `COMP#{compId}` | `MATCHDAY#{id}` |
| Match | `MATCHDAY#{matchdayId}` | `MATCH#{id}` |
| Player | `PLAYER#{id}` | `META` |
| Prediction | `PLAYER#{playerId}` | `PRED#MATCH#{matchId}` |
| RankingEntry | `COMP#{compId}#RANK` | `PLAYER#{playerId}` |

- Index secondaire global (GSI) `MatchdayIndex` : `matchdayId` (PK) pour récupérer tous les matchs d'une journée
- Index secondaire global (GSI) `MatchPredictionsIndex` : `matchId` (PK) pour récupérer tous les pronostics d'un match
- Région AWS : `eu-west-3` (Paris)
- Environnements : `dev` et `prod` (deux tables séparées)

### Infrastructure

- IaC : **Terraform**
- Ressources gérées : Lambda, API Gateway, DynamoDB, S3, CloudFront, IAM roles
- Variables d'environnement Lambda : `DYNAMODB_TABLE`, `NODE_ENV`
- Logs : CloudWatch Logs (groupe `/aws/lambda/back-oh-rugby-{env}`)
- Pas de VPC (DynamoDB accessible via endpoint public)

## Stratégie Technique Court Terme

- construire le front d'abord avec des mocks TypeScript ;
- isoler les données mockées dans des fichiers dédiés ;
- séparer les modèles métier, les données mockées et la logique de calcul du classement ;
- prévoir une couche de service facilement remplaçable par une API plus tard ;
- brancher ensuite le front sur l'API Lambda en remplaçant les mocks par des appels HTTP.

## Calendrier des Matchs

| Journée | Date | Matchs |
| ------- | ---- | ------ |
| J1 | 5 septembre | Bayonne – Toulon • Bordeaux-Bègles – Racing 92 • Castres – Vannes • La Rochelle – Toulouse • Lyon – Clermont • Montpellier – Pau • Stade français – Perpignan |
| J2 | 12 septembre | Perpignan – Castres • Vannes – Montpellier • Clermont – Stade français • Pau – Bayonne • Racing 92 – Lyon • Toulon – La Rochelle • Toulouse – Bordeaux-Bègles |
| J3 | 19 septembre | Bayonne – Clermont • Bordeaux-Bègles – Stade français • Vannes – Toulouse • Castres – Toulon • La Rochelle – Racing 92 • Lyon – Pau • Montpellier – Perpignan |
| J4 | 26 septembre | Perpignan – Bordeaux-Bègles • Clermont – Castres • Stade français – Lyon • Pau – La Rochelle • Racing 92 – Bayonne • Toulon – Vannes • Toulouse – Montpellier |
| J5 | 3 octobre | Bayonne – Stade français • Bordeaux-Bègles – Lyon • Vannes – Pau • Castres – Toulouse • La Rochelle – Clermont • Montpellier – Toulon • Racing 92 – Perpignan |
| J6 | 10 octobre | Perpignan – Vannes • Clermont – Bordeaux-Bègles • Lyon – La Rochelle • Stade français – Montpellier • Pau – Castres • Toulon – Racing 92 • Toulouse – Bayonne |
| J7 | 24 octobre | Bayonne – Lyon • Vannes – Clermont • Castres – Stade français • La Rochelle – Bordeaux-Bègles • Racing 92 – Montpellier • Toulon – Pau • Toulouse – Perpignan |
| J8 | 31 octobre | Perpignan – Toulon • Bordeaux-Bègles – Bayonne • Clermont – Racing 92 • Lyon – Vannes • Montpellier – Castres • Stade français – La Rochelle • Pau – Toulouse |
| J9 | 7 novembre | Vannes – Bordeaux-Bègles • Castres – Racing 92 • La Rochelle – Bayonne • Montpellier – Lyon • Pau – Perpignan • Toulon – Stade français • Toulouse – Clermont |
| J10 | 28 novembre | Bayonne – Castres • Bordeaux-Bègles – Montpellier • Clermont – Toulon • La Rochelle – Perpignan • Lyon – Toulouse • Stade français – Vannes • Racing 92 – Pau |
| J11 | 5 décembre | Perpignan – Clermont • Vannes – Bayonne • Castres – Lyon • Montpellier – La Rochelle • Pau – Stade français • Toulon – Bordeaux-Bègles • Toulouse – Racing 92 |
| J12 | 19 décembre | Bayonne – Perpignan • Bordeaux-Bègles – Pau • Clermont – Montpellier • La Rochelle – Castres • Lyon – Toulon • Stade français – Toulouse • Racing 92 – Vannes |
| J13 | 26 décembre | Perpignan – Lyon • Vannes – La Rochelle • Castres – Bordeaux-Bègles • Montpellier – Bayonne • Pau – Clermont • Racing 92 – Stade français • Toulouse – Toulon |
| J14 | 2 janvier | Bayonne – Toulouse • Bordeaux-Bègles – Perpignan • Clermont – Vannes • La Rochelle – Pau • Lyon – Racing 92 • Stade français – Castres • Toulon – Montpellier |
| J15 | 23 janvier | Vannes – Perpignan • Castres – Clermont • Montpellier – Stade français • Pau – Lyon • Racing 92 – Bordeaux-Bègles • Toulon – Bayonne • Toulouse – La Rochelle |
| J16 | 30 janvier | Perpignan – Stade français • Bordeaux-Bègles – Vannes • Clermont – Toulouse • La Rochelle – Toulon • Lyon – Bayonne • Pau – Montpellier • Racing 92 – Castres |
| J17 | 20 février | Bayonne – La Rochelle • Perpignan – Pau • Vannes – Castres • Montpellier – Racing 92 • Stade français – Bordeaux-Bègles • Toulon – Clermont • Toulouse – Lyon |
| J18 | 27 février | Bordeaux-Bègles – Toulon • Castres – Perpignan • Clermont – Bayonne • La Rochelle – Stade français • Lyon – Montpellier • Pau – Vannes • Racing 92 – Toulouse |
| J19 | 20 mars | Bayonne – Bordeaux-Bègles • Perpignan – Racing 92 • Castres – La Rochelle • Montpellier – Clermont • Stade français – Pau • Toulon – Lyon • Toulouse – Vannes |
| J20 | 27 mars | Bayonne – Montpellier • Perpignan – La Rochelle • Bordeaux-Bègles – Toulouse • Vannes – Stade français • Clermont – Pau • Lyon – Castres • Racing 92 – Toulon |
| J21 | 17 avril | Castres – Bayonne • La Rochelle – Vannes • Lyon – Perpignan • Montpellier – Bordeaux-Bègles • Stade français – Clermont • Pau – Racing 92 • Toulon – Toulouse |
| J22 | 24 avril | Bayonne – Pau • Perpignan – Montpellier • Bordeaux-Bègles – La Rochelle • Vannes – Toulon • Clermont – Lyon • Stade français – Racing 92 • Toulouse – Castres |
| J23 | 8 mai | Bayonne – Vannes • Clermont – Perpignan • Lyon – Stade français • Montpellier – Toulouse • Pau – Bordeaux-Bègles • Racing 92 – La Rochelle • Toulon – Castres |
| J24 | 15 mai | Perpignan – Bayonne • Bordeaux-Bègles – Clermont • Vannes – Racing 92 • Castres – Montpellier • La Rochelle – Lyon • Stade français – Toulon • Toulouse – Pau |
| J25 | 29 mai | Bayonne – Racing 92 • Castres – Pau • Clermont – La Rochelle • Lyon – Bordeaux-Bègles • Montpellier – Vannes • Toulon – Perpignan • Toulouse – Stade français |
| J26 | 5 juin | Perpignan – Toulouse • Bordeaux-Bègles – Castres • Vannes – Lyon • La Rochelle – Montpellier • Stade français – Bayonne • Pau – Toulon • Racing 92 – Clermont |

## Décision de Départ Recommandée

Pour lancer le produit sans bloquer le design ni le front :

- partir sur une compétition multi-journées ;
- afficher un classement global et un classement par journée ;
- mocker les joueurs, les matchs, les pronostics et le classement ;
- commencer par des pronostics d'issue de match ;
- intégrer explicitement les bonus dans le modèle de pronostic dès maintenant ;
- ajouter les scores exacts dans une itération suivante.
