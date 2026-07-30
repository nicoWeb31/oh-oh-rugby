# TODO — OhRugby

## Decisions a prendre avant de coder

- [x] Definir le bareme de points — issue correcte : 3 pts, bonus offensif : 1 pt, bonus defensif : 1 pt (max 5 pts/match, bonus valides seulement si issue correcte)
- [x] Direction artistique : style vintage jeu video arcade (ref. Jonah Lomu Rugby 1997) — typo bold/condensee, couleurs saturees, UI dense, leaderboard style arcade
- [x] Stack backend : API REST Express sur AWS Lambda, exposee par API Gateway HTTP API, avec DynamoDB comme base de donnees
- [x] Infrastructure : Terraform ; region AWS cible : `eu-west-3` (Paris) ; environnements : `dev` et `prod`
- [x] Adaptateur Express/Lambda retenu : `serverless-http`
- [ ] Valider les patterns d'acces DynamoDB et decider si un troisieme GSI est necessaire pour `playerId + matchdayId`
- [ ] Decider si les classements sont calcules a la demande ou materialises
- [ ] Definir la strategie d'authentification post-V1 et le lien entre l'identite authentifiee et un `Player`
- [ ] Choisir l'outil IaC Terraform : modules custom ou registry communautaire (terraform-aws-modules) ?
- [ ] Definir le nom de domaine et la strategie SSL (ACM + CloudFront)
- [ ] Definir les origines CORS autorisees pour `dev`, `prod` et le developpement local
- [ ] Configurer l'URL de l'API Angular par environnement (elle cible actuellement `http://localhost:3333/api`)

---

## Phase 1 — MVP front (`apps/oh-rugby`)

> Objectif : application Angular fonctionnelle, alimentee par l'API locale.

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

- [x] Definir les 14 equipes TOP 14 dans les donnees de demonstration de l'API
- [x] Definir les 26 journees avec leurs 7 matchs chacune dans les donnees de demonstration de l'API
- [x] Definir les joueurs de demonstration dans l'API
- [x] Definir des pronostics existants dans l'API
- [x] Deplacer les donnees de demonstration du frontend vers `apps/back-oh-rugby/src/data/`

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

- [x] Installer les dependances runtime : `serverless-http`, AWS SDK DynamoDB et CORS
- [x] Configurer `serverless-http`
- [ ] Separer la creation de l'application Express du demarrage local (`createApp` / `app.listen`)
- [x] Adapter `src/main.ts` pour exporter un `handler` Lambda (garder `app.listen` uniquement pour le dev local)
- [x] Ajouter les middlewares JSON, CORS et gestion d'erreurs
- [x] Ajouter un endpoint de sante (`GET /api/health`)

### Routes API

- [x] Formaliser le contrat des reponses et erreurs HTTP
- [x] `GET /api/competitions/:id`
- [x] `GET /api/matchdays?competitionId=`
- [x] `GET /api/matchdays/:id`
- [x] `GET /api/players`
- [x] `GET /api/predictions?playerId=&matchdayId=`
- [x] `PUT /api/predictions/:matchId` (valide l'entree et verifie cote serveur que la journee est active)
- [x] `GET /api/ranking?competitionId=`
- [x] `GET /api/ranking?competitionId=&matchdayId=`

### Couche DynamoDB

- [x] Installer le client AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- [ ] Creer un module `dynamo.client.ts` (singleton)
- [ ] Definir les types d'items DynamoDB et les fonctions de mapping domaine ↔ DynamoDB
- [ ] Creer les repositories : `Competition`, `Matchday`, `Match`, `Player`, `Prediction`, `Ranking`
- [ ] Implementer les requetes via `PK/SK`, `MatchdayIndex` et `MatchPredictionsIndex`
- [ ] Implementer le pattern retenu pour les pronostics d'un joueur par journee
- [ ] Implementer la logique de scoring cote back, independamment des repositories
- [ ] Ajouter des tests unitaires des regles metier et des tests d'integration des routes

### Seed

- [ ] Script de seed DynamoDB : journees, matchs, equipes
- [ ] Script de seed : joueurs initiaux
- [x] Deplacer les donnees de demonstration du frontend vers l'API en memoire

---

## Phase 3 — Infrastructure Terraform (`infra/terraform/`)

- [ ] Configurer le backend Terraform (S3 remote state + DynamoDB lock)
- [ ] Creer les workspaces `dev` et `prod`
- [ ] Module DynamoDB : table `oh-rugby-{env}` avec les deux GSI
- [ ] Module Lambda : runtime Node.js LTS supporte + IAM role + politique DynamoDB au moindre privilege
- [ ] Module API Gateway : HTTP API v2 connectee a la Lambda, avec le CORS configure par environnement
- [ ] Module S3 : bucket site statique
- [ ] Module CloudFront : distribution + regle 404 vers index.html + certificat ACM
- [ ] Module CloudWatch : log group Lambda
- [ ] Definir les variables (`env`, `region`, `domain_name`) et les outputs (URL API, URL CloudFront)

---

## Phase 4 — Branchement Front sur l'API

- [x] Remplacer les mocks par de vrais appels HTTP
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
