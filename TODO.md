# TODO — OhRugby

## Decisions a prendre avant de coder

- [x] Definir le bareme de points — issue correcte : 3 pts, bonus offensif : 1 pt, bonus defensif : 1 pt (max 5 pts/match, bonus valides seulement si issue correcte)
- [x] Direction artistique : style vintage jeu video arcade (ref. Jonah Lomu Rugby 1997) — typo bold/condensee, couleurs saturees, UI dense, leaderboard style arcade
- [x] Stack backend : API REST Express sur AWS Lambda, exposee par API Gateway HTTP API, avec DynamoDB comme base de donnees
- [x] Infrastructure : Terraform ; region AWS cible : `eu-west-3` (Paris) ; environnements : `dev` et `prod`
- [x] Adaptateur Express/Lambda retenu : `serverless-http`
- [x] Valider les patterns d'acces DynamoDB et decider si un troisieme GSI est necessaire pour `playerId + matchdayId` — decision : pas de GSI, les matchs sont imbriques dans l'item `Matchday` et le matchday d'un `matchId` se derive de son prefixe (`mdX-mY`), donc tous les acces actuels passent par `PK`/`SK` (voir `infra/terraform/README.md`)
- [x] Decider si les classements sont calcules a la demande ou materialises — decision : a la demande (echelle V1 trop petite pour justifier une materialisation)
- [ ] Definir la strategie d'authentification post-V1 et le lien entre l'identite authentifiee et un `Player`
- [x] Choisir l'outil IaC Terraform : modules custom ou registry communautaire (terraform-aws-modules) ? — decision : modules internes (`infra/terraform/modules/*`)
- [ ] Definir le nom de domaine et la strategie SSL (ACM + CloudFront) — differe : le front `dev`/`prod` est servi sur le domaine `*.cloudfront.net` par defaut en attendant l'achat d'un nom de domaine
- [x] Definir les origines CORS autorisees pour `dev`, `prod` et le developpement local — le Lambda recoit `ALLOWED_ORIGINS` = domaine CloudFront de l'environnement deploye ; en local la variable est absente et toutes les origines sont autorisees (comportement deja code)
- [x] Configurer l'URL de l'API Angular par environnement — `environment.ts`/`environment.dev.ts`/`environment.prod.ts` + `fileReplacements`, injectee par le pipeline de deploiement

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
- [x] Separer la creation de l'application Express du demarrage local (`createApp` / `app.listen`)
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
- [x] Creer un module `dynamo.client.ts` (singleton) — `src/dynamodb/client.ts`
- [x] Definir les types d'items DynamoDB et les fonctions de mapping domaine ↔ DynamoDB — `src/dynamodb/keys.ts` + mapping inline par repository
- [x] Creer les repositories : `Competition`, `Matchday`, `Player`, `Prediction` — pas de repository `Match` ni `Ranking` distincts (matchs imbriques dans `Matchday`, classement calcule a la demande, voir plus haut)
- [x] Implementer les requetes via `PK/SK` — pas de GSI (decision documentee dans `infra/terraform/README.md`)
- [x] Implementer le pattern retenu pour les pronostics d'un joueur par journee
- [x] Implementer la logique de scoring cote back, independamment des repositories — `src/domain/scoring.ts`
- [x] Ajouter des tests unitaires des regles metier — `src/domain/scoring.spec.ts` ; tests d'integration des routes non faits

### Seed

- [x] Script de seed DynamoDB : journees, matchs, equipes, joueurs, pronostics — `npm run seed:dynamodb` (`src/scripts/seed.ts`), et workflow manuel `seed-dynamodb.yml`
- [x] Deplacer les donnees de demonstration du frontend vers l'API en memoire

---

## Phase 3 — Infrastructure Terraform (`infra/terraform/`)

- [x] Configurer le backend Terraform (S3 remote state + DynamoDB lock) — `bootstrap/` (a appliquer une fois manuellement, voir `infra/terraform/README.md`)
- [x] Creer les workspaces `dev` et `prod` — via fichiers `envs/dev.tfvars`+`dev.backend.hcl` / `envs/prod.tfvars`+`prod.backend.hcl` plutot que des workspaces Terraform natifs (etats totalement isoles, plus simple a auditer par environnement)
- [x] Module DynamoDB : table `oh-rugby-{env}` — sans GSI (decision documentee dans `infra/terraform/README.md`)
- [x] Module Lambda : runtime `nodejs22.x` + IAM role + politique DynamoDB scopee a la table de l'environnement
- [x] Module API Gateway : HTTP API v2 connectee a la Lambda — CORS gere cote Express (`ALLOWED_ORIGINS`), pas au niveau API Gateway
- [x] Module S3 : bucket site statique
- [x] Module CloudFront : distribution + regle 403/404 vers index.html — pas de certificat ACM (domaine par defaut `*.cloudfront.net`, voir question technique "domaine" toujours ouverte)
- [x] Module CloudWatch : log group Lambda + log group API Gateway
- [x] Definir les variables (`env`, `region`, `account_id`) et les outputs (URL API, domaine CloudFront, nom du bucket, etc.) — pas de `domain_name` (hors perimetre pour l'instant)

---

## Phase 4 — Branchement Front sur l'API

- [x] Remplacer les mocks par de vrais appels HTTP
- [ ] Gerer les etats de chargement et les erreurs dans l'UI
- [ ] Tester le flux complet en local (Lambda dev + Angular dev)
- [ ] Tester le flux complet sur `dev` AWS

---

## Phase 5 — Deploiement

- [x] Documenter la procedure de deploiement manuel — `infra/terraform/README.md` ; le deploiement applicatif est desormais automatise via GitHub Actions (`deploy-dev.yml` sur push `develop`, `deploy-prod.yml` sur push `main`), seul le bootstrap initial reste manuel
- [ ] Deployer l'infra Terraform sur `dev` — necessite le bootstrap (identifiants AWS) puis un push sur `develop`
- [ ] Deployer l'application sur `dev` (front + back) — automatique une fois le bootstrap fait
- [ ] Valider le flux complet sur `dev`
- [ ] Deployer sur `prod`
