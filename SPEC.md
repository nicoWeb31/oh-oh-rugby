# OhRugby Product Spec

## Objectif

Construire une application de pronostics autour de matchs de rugby.

Le principe de base :

- des joueurs participent à une compétition de pronostics ;
- une compétition peut couvrir une ou plusieurs journées de championnat ;
- pour chaque journée, les joueurs saisissent leurs pronostics match par match ;
- un classement est calculé à partir des points gagnés sur chaque pronostic.

Le frontend est alimenté par l'API locale. Les données de démonstration sont hébergées temporairement dans l'API ; la cible de persistance reste DynamoDB pour le déploiement AWS.

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

- Le barème lié aux scores exacts, prévu dans une itération ultérieure, reste à définir.
- Le détail de la saisie des bonus dans l'interface (par équipe ou sous une forme simplifiée) reste à préciser.

## Questions Techniques Ouvertes

Décisions prises pour le déploiement de l'environnement `dev` (détail et justification dans `infra/terraform/README.md`) :

- **Accès DynamoDB** : table unique sans GSI. Les matchs sont imbriqués dans l'item `Matchday` (jamais lus indépendamment) et le `matchdayId` d'un `matchId` se dérive de son préfixe (`mdX-mY`), ce qui couvre tous les accès actuels via `PK`/`SK` seuls.
- **Classement** : calculé à la demande à chaque requête, pas matérialisé — l'échelle V1 (quelques joueurs) rend cela trivial.
- **CORS ouvert (MVP)** : `ALLOWED_ORIGINS` n'est pour l'instant pas défini sur le Lambda déployé, donc toutes les origines sont autorisées (comportement déjà en place pour le développement local). À restreindre au domaine CloudFront réel avant une exposition plus large.
- **Modules Terraform** : modules internes (`infra/terraform/modules/*`), pas de registry communautaire.

Toujours ouvert :

- Quel mécanisme d'authentification sera introduit après la V1 et comment l'identité du joueur sera-t-elle propagée à l'API ?
- Quel domaine public et quelle stratégie de certificats SSL utiliser ? En attendant, `dev` et `prod` sont servis sur le domaine par défaut `*.cloudfront.net`.

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

## Modèle de données de démonstration

Les entités suivantes sont partagées par le frontend et l'API. En local, les données de démonstration sont stockées dans `apps/back-oh-rugby/src/data/`, et non dans le frontend.

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

### Décisions confirmées

| Sujet | Décision |
| --- | --- |
| API | REST, servie par Express |
| Exécution | AWS Lambda derrière API Gateway HTTP API (v2) |
| Persistance | DynamoDB, une table par environnement |
| Infrastructure | Terraform |
| Région cible | `eu-west-3` (Paris) |
| Environnements | `dev` et `prod` |

La cible AWS est une API sans état : elle ne conserve aucune session en mémoire entre deux invocations Lambda et persiste les données dans DynamoDB. L'implémentation locale actuelle conserve seulement les données de démonstration en mémoire de processus ; elle est donc temporaire et non durable. Les règles métier, notamment le verrouillage d'une journée et le calcul des points, sont appliquées côté serveur afin de ne pas dépendre du client Angular.

### Frontend — Angular sur S3

- Application : `apps/oh-rugby` (Angular, déjà créé)
- Build : `npm exec -- nx run oh-rugby:build --configuration=production` → `dist/apps/oh-rugby/browser/`
- Déploiement : bucket S3 en mode site statique, distribué via CloudFront
- Routing SPA : rediriger les 404 vers `index.html` (règle d'erreur CloudFront ou S3)
- Variables d'environnement : l'URL de l'API est injectée au build via `environment.ts`

### Backend — Express sur AWS Lambda

- Application : `apps/back-oh-rugby` (Express, déjà créé)
- Express porte les routes, les middlewares (CORS, validation, gestion d'erreurs) et l'orchestration des cas d'usage.
- API Gateway reçoit les requêtes HTTP et les transmet en proxy à la Lambda ; la Lambda convertit l'événement API Gateway en requête Express via un adaptateur dédié.
- L'application Express doit être créée indépendamment du démarrage local (par exemple `createApp()`), afin de partager la même configuration entre le serveur de développement et le `handler` Lambda.
- Point d'entrée Lambda : `handler` exporté depuis `src/main.ts`; `app.listen` ne doit être exécuté qu'en développement local.
- L'adaptateur Express/Lambda retenu est `serverless-http`.
- Build : `npm exec -- nx run back-oh-rugby:build --configuration=production` → `dist/apps/back-oh-rugby/`
- Déploiement : fonction Lambda avec une version Node.js LTS prise en charge par AWS au moment du déploiement, exposée via API Gateway HTTP API (v2).
- CORS : si `ALLOWED_ORIGINS` est défini, il contient la liste blanche d'origines séparées par des virgules. En l'absence de cette variable, toutes les origines sont autorisées pour faciliter le développement local ; ce comportement devra être interdit en production.
- Observabilité : logs structurés dans CloudWatch, incluant un identifiant de requête et les erreurs applicatives sans exposer de données personnelles.

#### Dépendances et exécution locale

| Dépendance | Rôle |
| --- | --- |
| `express` | Routes et middlewares de l'API |
| `serverless-http` | Adaptation de l'application Express en handler Lambda |
| `@aws-sdk/client-dynamodb` | Client DynamoDB AWS SDK v3 |
| `@aws-sdk/lib-dynamodb` | Commandes DynamoDB de haut niveau (`DocumentClient`) |
| `cors` | Gestion de la liste blanche des origines HTTP |

Le développement local utilise le serveur Express standard ; aucun émulateur Lambda n'est requis pour démarrer l'API :

```bash
npm install
npm exec -- nx run back-oh-rugby:serve
```

L'API est alors disponible sur `http://localhost:3333/api`; `GET /api/health` permet de vérifier son démarrage. Lors de l'ajout de DynamoDB, le client devra pouvoir recevoir une URL d'endpoint locale pour les tests ou un émulateur, sans modifier le code métier.

En développement, les données de démonstration (compétition, 26 journées, joueurs et pronostics) sont fournies par l'API en mémoire depuis `apps/back-oh-rugby/src/data/`. Elles sont réinitialisées au redémarrage du backend. Le frontend ne contient plus de mocks et interroge `http://localhost:3333/api` via `HttpClient`.

#### Contrat et responsabilités de l'API

- Les entrées HTTP sont validées avant toute écriture ; les erreurs utilisent un format JSON cohérent.
- La route d'écriture d'un pronostic vérifie côté serveur que la journée est active, que le match appartient bien à cette journée et que la valeur du pronostic est valide.
- Les futurs repositories DynamoDB ne contiendront pas de règles métier ; ils traduiront les modèles de domaine vers les items DynamoDB.
- Les calculs de classement et de score restent testables sans AWS, dans une couche métier dédiée.

#### Endpoints actuellement disponibles

| Méthode | Route | Usage |
| --- | --- | --- |
| `GET` | `/api/health` | Vérifier que l'API est disponible |
| `GET` | `/api/competitions/:id` | Lire la compétition |
| `GET` | `/api/matchdays?competitionId=` | Lister les journées et leurs matchs |
| `GET` | `/api/matchdays/:id` | Lire une journée |
| `GET` | `/api/players` | Lister les joueurs |
| `GET` | `/api/predictions?playerId=&matchdayId=` | Lire les pronostics d'un joueur |
| `PUT` | `/api/predictions/:matchId` | Créer ou modifier un pronostic actif |
| `GET` | `/api/ranking?competitionId=&matchdayId=` | Lire le classement global ou d'une journée |

### Base de données — DynamoDB

- Table principale : `oh-rugby-{env}` (single-table design)
- Clé de partition (`PK`) et clé de tri (`SK`) selon le pattern suivant. Chaque item porte aussi un attribut `entityType` et les dates sont enregistrées en ISO 8601 UTC.

| Entité | PK | SK |
|---|---|---|
| Competition | `COMP#{id}` | `META` |
| Matchday | `COMP#{compId}` | `MATCHDAY#{id}` |
| Match | `MATCHDAY#{matchdayId}` | `MATCH#{id}` |
| Player | `PLAYER#{id}` | `META` |
| Prediction | `PLAYER#{playerId}` | `PRED#MATCH#{matchId}` |
| RankingEntry global | `COMP#{compId}#RANK#GLOBAL` | `PLAYER#{playerId}` |
| RankingEntry par journée | `COMP#{compId}#RANK#MATCHDAY#{matchdayId}` | `PLAYER#{playerId}` |

- Index secondaire global (GSI) `MatchdayIndex` : `GSI1PK = MATCHDAY#{matchdayId}`, `GSI1SK = MATCH#{matchId}` pour récupérer tous les matchs d'une journée.
- Index secondaire global (GSI) `MatchPredictionsIndex` : `GSI2PK = MATCH#{matchId}`, `GSI2SK = PLAYER#{playerId}` pour récupérer tous les pronostics d'un match.
- Un accès direct « pronostics d'un joueur pour une journée » n'est pas encore couvert par ces deux index. Il est explicitement à décider avant l'implémentation : troisième GSI, ou lecture ciblée de la partition du joueur si le volume le permet.
- Les entrées de classement sont des projections de lecture : leur stratégie de mise à jour (à la demande ou matérialisée) reste à décider.
- Région AWS : `eu-west-3` (Paris)
- Environnements : `dev` et `prod` (deux tables séparées)

#### Accès attendus en V1

| Besoin | Accès DynamoDB prévu |
| --- | --- |
| Lire une compétition et ses journées | `Query` sur `PK = COMP#{competitionId}` |
| Lire les matchs d'une journée | `Query` sur `MatchdayIndex` |
| Lire les pronostics d'un match | `Query` sur `MatchPredictionsIndex` |
| Lire les pronostics d'un joueur pour une journée | À décider avant le développement du repository |
| Lire un classement global ou par journée | `Query` sur la partition de classement concernée |

### Infrastructure

- IaC : **Terraform**
- Ressources gérées : Lambda, API Gateway, DynamoDB, S3, CloudFront, IAM roles
- Variables d'environnement Lambda : `DYNAMODB_TABLE`, `NODE_ENV`, `ALLOWED_ORIGINS`
- Logs : CloudWatch Logs (groupe `/aws/lambda/back-oh-rugby-{env}`)
- Pas de VPC (DynamoDB accessible via endpoint public)

## Stratégie Technique Court Terme

- fournir les données de démonstration depuis l'API locale en mémoire ;
- séparer les modèles métier, les données de développement et la logique de calcul du classement ;
- conserver les services Angular comme clients HTTP de l'API ;
- remplacer les données en mémoire par DynamoDB sans changer le contrat HTTP du frontend.

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
