# Backend — `apps/back-oh-rugby`

Ce document explique **comment** l'API a été construite et **pourquoi**, à un niveau que la spec fonctionnelle (`SPEC.md`) et le README ne couvrent pas : le mécanisme interne, les compromis choisis, et un bug réel qui vaut la peine d'être compris. La liste complète des routes HTTP est dans `README.md` / `SPEC.md` — elle n'est pas répétée ici.

## En bref

Une seule app Express (`createApp()`) tourne indifféremment en local (`app.listen`) et sur AWS Lambda (enveloppée par `serverless-http`) — un bug de bundling a d'ailleurs empêché ça de marcher au premier déploiement (cas d'école, détaillé plus bas). La persistance DynamoDB suit un design single-table volontairement simple : pas de GSI, pas d'entité `Match` séparée (les matchs sont imbriqués dans `Matchday`), le classement est recalculé à la demande plutôt que stocké. Toute la logique métier (statut d'une journée, barème de points, verrouillage de la saisie) vit dans une couche pure (`src/domain/scoring.ts`) sans dépendance AWS, et est **revalidée côté serveur** à chaque écriture — jamais fait confiance au client. L'authentification est volontairement minimale ("fake auth" par code statique), et la route d'enregistrement des résultats (`/admin`) n'a **aucune** protection, même pas ce code — c'est la dette de sécurité la plus visible du projet. Seul `scoring.ts` est couvert par des tests.

## Architecture générale : un seul Express, deux façons de le démarrer

Le code métier (routes, validation, règles) vit dans une seule fonction, `createApp()` (`src/app.ts`), qui retourne une instance Express classique. Deux points d'entrée différents utilisent cette même app :

- **En local** (`nx run back-oh-rugby:serve`) : `src/main.ts` appelle `app.listen(port)`, comme n'importe quel serveur Node.
- **Sur AWS** : la même app est enveloppée par `serverless-http`, qui expose un `handler` Lambda.

```ts
export const app = createApp();
export const handler = serverless(app);

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(port, ...);
}
```

**Pourquoi séparer `createApp()` de `app.listen()` ?** Un handler Lambda n'écoute jamais un port : AWS invoque la fonction avec un objet `event` (la requête HTTP telle que vue par API Gateway) et un `context`, et attend une réponse en retour de l'appel de fonction — il n'y a pas de socket TCP ouvert en permanence. Si `app.listen()` était appelé inconditionnellement, chaque cold start Lambda essaierait d'ouvrir un port qui ne sert à rien et ne serait jamais atteint par du trafic réel. En gardant `createApp()` pur (aucun effet de bord), la même logique métier tourne identiquement en local et en prod — c'est ce qui permet de développer et tester sans émulateur Lambda.

**`serverless-http`** est l'adaptateur qui traduit dans les deux sens : il transforme l'event API Gateway HTTP API v2 (méthode, path, headers, body, query string) en une fausse requête Express, laisse Express router et exécuter les middlewares normalement, puis reconvertit la réponse Express (status, headers, body) au format que Lambda doit renvoyer à API Gateway. Sans lui, il faudrait réécrire à la main tout le routing pour parler le format événementiel d'AWS.

### Le bug du handler introuvable (commit `a9d7435`) — un cas d'école

Après le premier déploiement, chaque requête sur `dev` échouait avec `Runtime.HandlerNotFound: main.handler is undefined or not exported`, alors que le CORS semblait en cause côté navigateur. La vraie cause : le build esbuild/webpack du projet Nx (template par défaut, pensé pour `node main.js` en exécution directe) ne configurait pas `output.library`. Résultat : le bundle final n'exposait pas ses `export` via `module.exports` — `require('./main.js')` renvoyait `{}`, donc Lambda ne trouvait jamais `.handler`.

**Pédagogie** : un bundler (esbuild, webpack) transforme plusieurs fichiers ES modules en un seul fichier. Pour qu'un `require()` externe (ici, le runtime Lambda) puisse lire les exports de ce fichier, le bundler doit explicitement écrire ces exports sur `module.exports` au format CommonJS — ce n'est pas automatique, c'est une option de configuration (`library: { type: 'commonjs2' }`). Sans elle, le code à l'intérieur du bundle continue de fonctionner entre lui (imports/exports internes résolus), mais rien n'est visible depuis l'extérieur du fichier. C'est un piège classique de la migration "app Node classique" → "bundle Lambda" : le bundle _s'exécute_ correctement (pas d'erreur de syntaxe, pas de crash au chargement), donc rien ne semble cassé jusqu'à ce qu'un système externe essaie de lire une de ses propriétés exportées.

Le même commit a aussi corrigé la détection "suis-je en local ou sur Lambda ?". L'idiome classique `require.main === module` (« ce fichier est-il le point d'entrée du process, ou un import ? ») ne fonctionne pas ici car le runtime Node de Lambda charge le bundle CommonJS via un `import()` dynamique, ce qui fait que Node le considère comme la racine de son propre graphe de require — la condition était donc toujours vraie, y compris en Lambda, et démarrait un `app.listen()` inutile (et bloquant) à chaque cold start. La correction retenue teste `AWS_LAMBDA_FUNCTION_NAME`, une variable d'environnement uniquement présente dans un vrai environnement d'exécution Lambda — un signal fiable là où l'idiome générique ne l'était pas.

## Persistance — DynamoDB en single-table design

### Le principe

Toutes les entités (compétition, journée, joueur, pronostic) vivent dans **une seule table** DynamoDB, différenciées par leurs clés `PK` (partition key) et `SK` (sort key), plus un attribut `entityType` pour le débogage/scan. C'est l'opposé d'un modèle relationnel où chaque type de donnée a sa propre table.

**Pédagogie** : DynamoDB ne fait pas de jointures. Un "single-table design" consiste à choisir des clés `PK`/`SK` qui encodent directement les patterns d'accès dont l'application a besoin, pour que chaque lecture soit un `GetItem` ou un `Query` unique — au prix de devoir savoir à l'avance _comment_ les données seront lues (contrairement à SQL où on peut interroger la donnée sous n'importe quel angle après coup).

Les clés réellement utilisées (`src/dynamodb/keys.ts`) :

| Entité      | PK                  | SK               |
| ----------- | ------------------- | ---------------- |
| Competition | `COMP#{id}`         | `META`           |
| Matchday    | `MATCHDAY#{id}`     | `META`           |
| Player      | `PLAYER#{id}`       | `META`           |
| Prediction  | `PLAYER#{playerId}` | `PRED#{matchId}` |

> **Divergence avec `SPEC.md`** : la spec décrit un schéma plus élaboré (`Matchday` sous `PK = COMP#{compId}` / `SK = MATCHDAY#{id}`, une entité `Match` séparée avec ses propres clés, deux GSI `MatchdayIndex`/`MatchPredictionsIndex`, et une SK de prédiction `PRED#MATCH#{matchId}`). Le code implémenté est plus simple : `Matchday` a sa propre partition indépendante de la compétition (`PK = MATCHDAY#{id}`), les matchs sont **imbriqués** dans l'objet `Matchday` (pas d'entité séparée), il n'y a **aucun GSI**, et la SK de prédiction est `PRED#{matchId}` (sans le segment `MATCH#`). Le fichier `infra/terraform/README.md` documente déjà cette décision ("pas de GSI ... les matchs sont stockés imbriqués") mais `SPEC.md` n'a pas été mis à jour pour refléter le schéma de clés final — à corriger si vous voulez que la spec reste une source de vérité.

### Pourquoi pas de GSI (Global Secondary Index) ?

Un GSI permet d'interroger une table selon un autre couple de clés que le PK/SK primaire — utile quand un même besoin de lecture ne peut pas être satisfait par la clé primaire seule. Ici, tous les accès nécessaires se résolvent avec la clé primaire dès qu'on connaît l'id de la ressource :

- lire une compétition, une journée, un joueur → `GetItem` direct ;
- lire les pronostics d'un joueur (éventuellement filtrés à une journée) → `Query` sur `PK = PLAYER#{playerId}` avec `begins_with(SK, 'PRED#')`, puis filtrage applicatif en mémoire (`prediction.repository.ts` + filtrage dans `app.ts` sur les `matchIds` de la journée) ;
- retrouver la journée d'un match → pas besoin d'index inverse : les ids de match sont générés sous la forme `{matchdayId}-m{n}` (voir `data/matchdays.seed.ts`), donc `matchdayIdFromMatchId()` (`src/dynamodb/keys.ts`) dérive l'id de la journée en coupant la chaîne sur `-m`. C'est un exemple typique de "clé composite encodée dans l'id" plutôt qu'un index séparé à maintenir.

Ajouter un GSI a un coût réel (écriture dupliquée à chaque `PutItem`, cohérence éventuelle à gérer) ; ne pas en créer un quand l'accès direct suffit est une décision de simplicité assumée, documentée dans `infra/terraform/README.md`.

### Lister les joueurs : un `Scan` filtré, assumé comme tel

`listPlayers()` (`src/repositories/player.repository.ts`) fait un `ScanCommand` avec un `FilterExpression` sur `entityType = 'PLAYER'`. **Pédagogie** : un `Scan` lit _toute_ la table puis filtre côté serveur DynamoDB (contrairement à un `Query`, qui cible directement une partition) — c'est l'opération à éviter en général car son coût croît avec la taille totale de la table, indépendamment du nombre de résultats utiles. Ici c'est un choix délibéré et commenté dans le code : à l'échelle V1 (une poignée de joueurs, un groupe d'amis), le coût est négligeable, et créer un index dédié uniquement pour lister quelques joueurs serait une optimisation prématurée. À revisiter si la table grossit significativement (beaucoup de compétitions/saisons).

### Repositories : la frontière entre domaine et DynamoDB

Chaque repository (`competition`, `matchday`, `player`, `prediction`) suit le même schéma : construire la clé (`*Key()`), envoyer la commande AWS SDK v3 (`GetCommand`/`PutCommand`/`QueryCommand`/`BatchGetCommand`/`BatchWriteCommand`), puis `stripKeys()` pour retirer `PK`/`SK`/`entityType` avant de renvoyer un objet du domaine. Aucune règle métier n'y vit — c'est de la pure traduction domaine ↔ item DynamoDB, ce qui permet de tester la logique de scoring et de verrouillage sans dépendre d'AWS (voir plus bas).

Un détail de sécurité mérite d'être noté : `player.repository.ts` stocke un champ `code` (le code d'accès du joueur, voir plus bas) sur le même item DynamoDB que le reste du profil, mais `toPublicPlayer()` le supprime explicitement avant de retourner l'objet à l'appelant. **Pourquoi explicitement plutôt qu'implicitement** : si demain un champ sensible est ajouté à `Player`, un oubli de le retirer dans un des multiples endroits qui lisent des joueurs serait une fuite de données ; centraliser la purge dans une seule fonction utilisée par tous les points de lecture (`getPlayer`, `listPlayers`) réduit ce risque à un seul endroit à auditer.

`getMatchdaysByIds()` et le script de seed découpent leurs requêtes en lots de 100 (`BatchGetItem`) et 25 (`BatchWriteItem`) : ce sont des limites dures de l'API DynamoDB, pas un choix arbitraire — dépasser ces tailles fait échouer l'appel.

## Logique métier — `src/domain/scoring.ts`

C'est la seule couche qui contient des règles métier ; elle ne connaît ni Express ni DynamoDB (pas d'import AWS), ce qui la rend testable en isolation (`scoring.spec.ts`, exécuté avec Vitest sans rien démarrer).

### Statut d'une journée (`getMatchdayStatus`)

Calcule si une journée est `UPCOMING`, `ACTIVE` ou `LOCKED` à partir de sa date de match et de l'heure courante : active du lundi 00:00 de la semaine du match jusqu'au samedi 12:00 (commit `dc6b248`, qui a déplacé la deadline de saisie au samedi midi). C'est une fonction pure — pas d'accès disque ni réseau — ce qui permet de tester des dates arbitraires (`scoring.spec.ts` teste `2099-01-04` pour UPCOMING et `2000-01-02` pour LOCKED) sans avoir à mocker `Date.now()`.

### Barème de points (`scorePrediction`)

```ts
const outcomePoints = match.result.outcome === MatchOutcome.DRAW ? 4 : 3;
```

Règle actuelle : **3 points** pour une issue correcte (victoire à domicile ou à l'extérieur), **4 points** pour un nul correctement prédit, **+1 point** par bonus (offensif/défensif) correctement prédit, mais seulement si l'issue elle-même est correcte (`match.result.outcome !== prediction.outcome` → 0 point, quels que soient les bonus). Maximum réel par match : 6 points (nul + 2 bonus).

Cette règle est cohérente avec le tableau "Barème de Scoring des Pronostics" de `SPEC.md` (mis à jour par le commit `5a12302`, "award 4 points for a correctly predicted draw" : un nul est statistiquement plus rare/difficile à deviner qu'une victoire d'une des deux équipes, d'où le bonus) — pas de divergence ici entre le code et la spec produit.

### Classement (`buildRanking`)

Additionne, pour chaque joueur, les points de tous ses pronostics sur l'ensemble des journées demandées, trie par points décroissants, puis assigne un rang (`index + 1` après tri). Un joueur sans pronostic sur un match — ou sans aucun pronostic du tout — reste dans le classement avec 0 point plutôt que d'en être exclu (testé explicitement dans `scoring.spec.ts`) : c'est une règle produit volontaire (SPEC.md : "un joueur est quand même classé même s'il n'a pas pronostiqué tous les matchs"), implémentée en traitant une prédiction manquante comme un `scorePrediction` de 0 plutôt qu'en filtrant les joueurs en amont. Le classement est **recalculé à chaque requête** (`GET /api/ranking`), jamais stocké — cohérent avec la décision "pas de matérialisation" documentée dans `infra/terraform/README.md` : à l'échelle V1 (quelques joueurs, 182 matchs sur la saison), le recalcul complet est trivial en coût, et évite d'avoir à maintenir un mécanisme de mise à jour incrémentale (que faire quand un résultat est corrigé après coup ?).

## Verrouillage serveur et "fake auth"

### La journée active est vérifiée côté serveur, jamais fait confiance au client

`PUT /api/predictions/:matchId` (`app.ts`) revalide tout côté serveur avant d'écrire quoi que ce soit : le joueur existe, le code d'accès est correct, le match appartient bien à la journée déduite de son id, l'`outcome` est une valeur valide de l'enum, les bonus sont des booléens, et surtout `getMatchdayStatus(matchday) === ACTIVE`. **Pourquoi côté serveur et pas seulement dans l'UI Angular** : n'importe qui peut appeler l'API directement (curl, Postman) en contournant complètement le frontend ; une règle métier qui ne vit que côté client n'est pas une règle, c'est une suggestion. C'est un principe déjà énoncé dans `SPEC.md` ("les règles métier ... sont appliquées côté serveur afin de ne pas dépendre du client Angular") — le code s'y conforme bien.

### `POST /api/auth/verify` et le champ `code` : un frein, pas une authentification

Le commit `4c725db` a introduit un système de "fake auth" : chaque joueur a un `code` statique stocké dans DynamoDB (jamais renvoyé par l'API grâce à `toPublicPlayer()`), vérifié par `playerRepository.verifyCode()`. Le commentaire dans le code est explicite : _"Lightweight deterrent against playing as someone else, not real auth (static codes shared by word of mouth)"_.

**Ce que ça garantit** : un obstacle basique contre "je pronostique à la place d'un ami pour rigoler", suffisant pour un petit groupe de confiance.
**Ce que ça ne garantit pas** : ce n'est pas un mot de passe changeable, pas de hash (le code est comparé en clair après lecture DynamoDB), pas de session/token — chaque écriture renvoie le `code` en clair dans le body de la requête. Un `code` intercepté ou deviné donne un accès total et permanent à l'identité du joueur, sans expiration ni révocation possible autrement qu'en changeant le `code` en base. C'est un choix assumé pour la V1 (voir `SPEC.md`, "authentification réelle" listée en "Hors Périmètre Immédiat"), pas un oubli — mais toute évolution vers une exposition plus large que le groupe d'amis initial devrait remplacer ce mécanisme avant d'ouvrir l'accès plus largement.

### `PUT /api/matches/:matchId/result` (`/admin`, commit `12a10a0`) : aucune protection

Cette route enregistre le résultat réel d'un match (issue + bonus obtenus), consommé ensuite par `scorePrediction`. Le commentaire au-dessus dans `app.ts` est direct : _"No auth on this route: consistent with the rest of the MVP (no auth anywhere yet). Anyone with the app URL can record a match result."_ Contrairement à `PUT /api/predictions/:matchId`, il n'y a même pas de vérification de `code` ici — n'importe qui connaissant l'URL de l'API peut falsifier n'importe quel résultat de match, donc influencer le classement de tout le monde. C'est une dette de sécurité volontairement non traitée pour l'instant (page `/admin` non protégée côté front non plus), à corriger avant toute ouverture au-delà du cercle de confiance initial.

## Données de démo et seed

Les données de démonstration (`src/data/matchdays.seed.ts`, `players.seed.ts`, `predictions.seed.ts`) contiennent la compétition TOP 14, ses 26 journées de 7 matchs (calendrier réel 2026-2027, reset par le commit `de2bf41`), des joueurs et des pronostics d'exemple. Elles sont utilisées de deux façons distinctes :

- **En développement local sans DynamoDB configuré** : rien ne les charge automatiquement dans une base — elles servent de source pour le seed. Pour tester l'API localement, il faut soit pointer `DYNAMODB_ENDPOINT` vers une instance DynamoDB Local et lancer le seed dessus, soit cibler l'environnement `dev` réel.
- **Seed d'un environnement réel** (`src/scripts/seed.ts`, exécuté via `npm run seed:dynamodb` ou le workflow GitHub Actions `seed-dynamodb.yml`) : écrit tous les items en base par lots de 25 (`BatchWriteItem`).

**Le seed n'est pas idempotent au sens strict, mais il est sans risque à rejouer sur une table vide** : chaque `PutItem` remplace intégralement l'item existant à la même clé (comportement standard de `PutCommand`, pas un _merge_). Concrètement, cela veut dire que relancer le seed sur un environnement où de vrais joueurs ont déjà saisi des pronostics **écrase ces pronostics** avec les données de démo. `prod` contenant désormais de vraies données, deux garde-fous empêchent maintenant ce scénario plutôt que de se contenter de l'avertissement en commentaire : le workflow `seed-dynamodb.yml` ne propose plus `prod` comme cible, et la table `prod` a `prevent_destroy = true` côté Terraform. Détail complet dans `infra/terraform/README.md`.

## Tests

Seule la couche `src/domain/scoring.ts` a des tests unitaires (`scoring.spec.ts`, Vitest) : statut de journée, calcul de points par pronostic (issue correcte/incorrecte, nul, bonus valides seulement si l'issue est correcte), construction et tri du classement, y compris le cas d'un joueur sans pronostic. C'est un choix de périmètre cohérent avec le principe "logique métier testable sans AWS" énoncé dans `SPEC.md` : cette couche ne dépend d'aucun SDK, donc aucun mock n'est nécessaire pour la tester.

**Ce qui n'est pas testé** (assumé dans `TODO.md`) : aucun test d'intégration des routes Express (validation d'entrée, codes HTTP retournés, verrouillage effectif au niveau HTTP), ni des repositories DynamoDB. Le risque concret : une régression dans le branchement entre `app.ts` et `scoring.ts`/les repositories (mauvais paramètre passé, mauvaise gestion d'un cas 404/400) ne serait pas détectée par la suite de tests actuelle — seul un test manuel ou une régression en usage réel la révélerait, comme cela a été le cas pour le bug du handler Lambda (`a9d7435`), qui n'aurait pas été un test unitaire de toute façon (c'est un problème de configuration de build, pas de logique applicative) mais illustre qu'une bonne partie des risques réels de ce projet sont actuellement hors du filet de tests.

## Dette connue / choix explicitement écartés

- **Pas de GSI, pas d'entité `Match` séparée** — voir plus haut ; à revisiter seulement si un nouveau pattern de lecture apparaît (ex. "tous les pronostics sur un match donné", actuellement non exposé par l'API).
- **CORS ouvert par défaut** (`ALLOWED_ORIGINS` non défini sur l'environnement `dev` déployé) — toutes origines acceptées ; à restreindre avant une exposition publique plus large (`infra/terraform/README.md`).
- **Fake auth par code statique**, pas de vraie authentification — assumé pour un groupe d'amis, à remplacer avant toute ouverture plus large (voir ci-dessus).
- **`/admin` (enregistrement des résultats) sans aucune protection**, même pas le code joueur — dette de sécurité la plus visible du projet actuellement (voir `docs/security.md` pour la vue d'ensemble sécurité et les pistes de correction).
- **Pas de tests d'intégration** des routes ni des repositories.
- `packages/shared/models` contient encore `product.model.ts` (types `Product`/`ApiResponse`/`ProductFilter`), résidu du template Nx e-commerce initial (`shop`/`api` de démonstration), sans rapport avec OhRugby et non utilisé par le backend rugby — candidat à suppression si ce package sert uniquement à OhRugby désormais.
