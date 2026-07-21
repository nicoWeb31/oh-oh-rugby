# TODO — OhRugby

## Decisions a prendre avant de coder

- [x] Definir le bareme de points — issue correcte : 3 pts, bonus offensif : 1 pt, bonus defensif : 1 pt (max 5 pts/match, bonus valides seulement si issue correcte)
- [x] Direction artistique : style vintage jeu video arcade (ref. Jonah Lomu Rugby 1997) — typo bold/condensee, couleurs saturees, UI dense, leaderboard style arcade
- [ ] Choisir l'outil IaC Terraform : modules custom ou registry communautaire (terraform-aws-modules) ?
- [ ] Definir le nom de domaine et la strategie SSL (ACM + CloudFront)

---

## Phase 1 — MVP front mocke (`apps/oh-rugby`)

> Objectif : application Angular 100% fonctionnelle avec des donnees mockees en memoire.
> Aucun backend requis pour cette phase.

### Modeles partages (`packages/shared/models`)

- [ ] Creer le type `Competition`
- [ ] Creer le type `Matchday`
- [ ] Creer le type `Match`
- [ ] Creer le type `Player`
- [ ] Creer le type `Prediction`
- [ ] Creer le type `RankingEntry`
- [ ] Creer l'enum `MatchOutcome` (`HOME` | `DRAW` | `AWAY`)
- [ ] Creer l'enum `MatchdayStatus` (`UPCOMING` | `ACTIVE` | `LOCKED`)
- [ ] Exporter tous les types depuis l'index public de la lib

### Donnees mockees

- [ ] Mocker les 14 equipes TOP 14
- [ ] Mocker les 26 journees avec leurs 7 matchs chacune (calendrier complet de la SPEC)
- [ ] Mocker les joueurs
- [ ] Mocker des pronostics existants
- [ ] Isoler tous les mocks dans `src/mocks/`

### Services (interface identique a ce que l'API exposera plus tard)

- [ ] `CompetitionService` — recuperer la competition active
- [ ] `MatchdayService` — lister les journees, recuperer une journee, calculer son statut
- [ ] `MatchService` — recuperer les matchs d'une journee
- [ ] `PredictionService` — lire / ecrire les pronostics d'un joueur (en memoire pour le MVP)
- [ ] `RankingService` — calculer et recuperer le classement (par journee et global)
- [ ] `ScoringService` — logique de calcul des points (issue correcte : 3 pts, bonus offensif/defensif : 1 pt chacun, bonus valides seulement si issue correcte)

### Pages et composants

- [ ] Page dashboard : competition active + journee courante
- [ ] Page calendrier : liste des journees avec leur statut (upcoming / active / locked)
- [ ] Page journee : liste des matchs + formulaire de pronostics
  - [ ] Composant carte match
  - [ ] Composant saisie pronostic (issue + bonus)
  - [ ] Indicateur visuel du statut de la journee
  - [ ] Verrouillage du formulaire si journee non active
- [ ] Page classement
  - [ ] Onglet classement global cumule
  - [ ] Onglet classement par journee

---

## Phase 2 — Backend Express sur Lambda (`apps/back-oh-rugby`)

### Setup Lambda

- [ ] Installer `@vendia/serverless-express`
- [ ] Adapter `src/main.ts` pour exporter un `handler` Lambda (garder `app.listen` pour le dev local)
- [ ] Configurer CORS pour l'origine CloudFront

### Routes API

- [ ] `GET /api/competitions/:id`
- [ ] `GET /api/matchdays?competitionId=`
- [ ] `GET /api/matchdays/:id`
- [ ] `GET /api/players`
- [ ] `GET /api/predictions?playerId=&matchdayId=`
- [ ] `PUT /api/predictions/:matchId` (verifie que la journee est active)
- [ ] `GET /api/ranking?competitionId=`
- [ ] `GET /api/ranking?competitionId=&matchdayId=`

### Couche DynamoDB

- [ ] Installer le client AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- [ ] Creer un module `dynamo.client.ts` (singleton)
- [ ] Creer les repositories : `Competition`, `Matchday`, `Match`, `Player`, `Prediction`, `Ranking`
- [ ] Implémenter la logique de scoring cote back

### Seed

- [ ] Script de seed DynamoDB : journees, matchs, equipes
- [ ] Script de seed : joueurs initiaux

---

## Phase 3 — Infrastructure Terraform (`infra/terraform/`)

- [ ] Configurer le backend Terraform (S3 remote state + DynamoDB lock)
- [ ] Creer les workspaces `dev` et `prod`
- [ ] Module DynamoDB : table `oh-rugby-{env}` avec les deux GSI
- [ ] Module Lambda : fonction Node.js 20.x + IAM role + policy DynamoDB
- [ ] Module API Gateway : HTTP API v2 connectee a la Lambda
- [ ] Module S3 : bucket site statique
- [ ] Module CloudFront : distribution + regle 404 vers index.html + certificat ACM
- [ ] Module CloudWatch : log group Lambda
- [ ] Definir les variables (`env`, `region`, `domain_name`) et les outputs (URL API, URL CloudFront)

---

## Phase 4 — Branchement Front sur l'API

- [ ] Remplacer les mocks par de vrais appels HTTP (meme interface de service)
- [ ] Gerer les etats de chargement et les erreurs dans l'UI
- [ ] Tester le flux complet en local (Lambda dev + Angular dev)
- [ ] Tester le flux complet sur `dev` AWS

---

## Phase 5 — Deploiement

- [ ] Documenter la procedure de deploiement manuel
- [ ] Deployer l'infra Terraform sur `dev`
- [ ] Deployer l'application sur `dev` (front + back)
- [ ] Valider le flux complet sur `dev`
- [ ] Deployer sur `prod`
