# Frontend — `apps/oh-rugby`

Application Angular (standalone components, signals) qui consomme l'API décrite dans `SPEC.md` et `docs/backend.md`. Ce document explique ce qui a été construit, pourquoi ces choix précis, et les concepts Angular sous-jacents pour qui découvre le framework.

## En bref

L'app est un Angular moderne (standalone, signals, pas de `NgModule`) avec 5 pages en lazy-loading (login, dashboard, journée, classement, admin). L'accès aux pages joueur est filtré par une "fake auth" côté client (un code statique par joueur), **la vraie vérification se fait côté serveur** à chaque écriture — le guard Angular n'est qu'un confort d'ergonomie, pas une protection. L'URL de l'API est injectée au build selon l'environnement (local / dev / prod). Le statut d'une journée et le score d'un pronostic sont **recalculés côté client** pour un affichage réactif immédiat, en duplication assumée du calcul serveur (source de vérité) — ce qui a déjà causé un bug de désynchronisation réel. La direction artistique "arcade" est en CSS custom properties écrites à la main, sans framework. Les tests couvrent uniquement les deux morceaux de logique pure (pipe de date, service de scoring), rien côté composants.

## Architecture générale

L'app est un unique projet Nx (`oh-rugby`, `apps/oh-rugby/project.json`) construit avec `@angular/build:application` (l'exécuteur "application builder" moderne d'Angular, basé sur esbuild/Vite — remplace l'ancien `@angular-devkit/build-angular:browser`). Il n'y a **pas de `NgModule`** : tous les composants sont `standalone` (déclarés avec `imports: [...]` directement sur le `@Component`), et le bootstrap se fait via `bootstrapApplication` dans `main.ts` + un objet `ApplicationConfig` (`app.config.ts`).

**Pédagogie** : dans les anciennes versions d'Angular, chaque composant devait être déclaré dans un `NgModule` qui centralisait les imports. Les standalone components (stables depuis Angular 15+, généralisés en 17+) suppriment cette couche : chaque composant déclare directement ses propres dépendances, ce qui réduit le boilerplate et rend le lazy-loading par route trivial (voir plus bas).

Le fichier `apps/oh-rugby/src/app/nx-welcome.ts` est un résidu du générateur Nx (`nx g @nx/angular:app`) : il n'est importé nulle part et n'est jamais rendu. Il n'a pas été supprimé mais peut l'être sans risque — c'est de la dette cosmétique, pas fonctionnelle.

## Routing & navigation

`app.routes.ts` définit 5 routes, toutes en **lazy-loading** via `loadComponent: () => import(...)` :

```ts
{ path: 'matchday/:id', canActivate: [authGuard], loadComponent: () => import('./pages/matchday/matchday.component').then(m => m.MatchdayComponent) }
```

**Pourquoi le lazy-loading** : chaque page (`login`, `dashboard`, `matchday`, `ranking`, `admin`) devient un chunk JS séparé, téléchargé seulement quand l'utilisateur y navigue. Sur une app aussi petite ça n'a pas d'impact perceptible aujourd'hui, mais c'est le pattern par défaut recommandé par Angular avec le nouveau builder, et il ne coûte rien à mettre en place dès le départ.

`provideRouter(appRoutes, withComponentInputBinding())` dans `app.config.ts` active le **binding automatique des paramètres de route vers les `input()`** du composant : `MatchdayComponent` déclare `readonly id = input.required<string>();` et reçoit directement le `:id` de l'URL sans avoir à lire `ActivatedRoute` manuellement.

**Pédagogie** : `input()` est l'API de signal-based inputs (Angular 17.1+), une alternative au décorateur `@Input()`. Combinée à `withComponentInputBinding()`, elle permet de traiter un paramètre de route exactement comme un input de composant classique, dans le même style réactif que les signals utilisés partout ailleurs dans le code.

## Authentification (fake auth)

Introduite dans le commit `4c725db`. **Ce n'est pas un vrai système d'authentification** — c'est écrit noir sur blanc dans le code (`auth.guard.ts` : _"Not real security"_) et dans `SPEC.md` (l'authentification réelle est explicitement hors périmètre V1).

Mécanisme :

- Chaque joueur a un **code statique** (partagé oralement dans le groupe), stocké côté backend et jamais renvoyé par `GET /api/players`.
- `/login` : l'utilisateur choisit son nom dans un `<select>`, tape son code, l'app appelle `POST /api/auth/verify`. En cas de succès, `{playerId, code}` est écrit dans `localStorage` (`PlayerService`).
- `authGuard` (fonctionnel, `CanActivateFn`) protège `''`, `matchday/:id` et `ranking` : il vérifie juste la **présence** d'un couple `{playerId, code}` en `localStorage` (`hasStoredAuth()`), de façon synchrone, pour ne pas dépendre d'un appel réseau avant de décider d'autoriser la navigation.
- `/admin` **n'a volontairement aucun guard** : n'importe qui peut y saisir les résultats des matchs. C'est un choix assumé pour le MVP (petit groupe de confiance, pas d'utilisateurs malveillants attendus), documenté dans le commit et repris dans `app.routes.ts` par un commentaire explicite.

**Pourquoi ce niveau de protection suffit (pour l'instant)** : la vraie barrière n'est pas le guard Angular — n'importe qui peut appeler l'API directement avec `curl` en contournant totalement le frontend — mais la vérification du code **côté serveur**, refaite à chaque écriture (`PUT /api/predictions/:matchId` exige le code à nouveau). Le guard ne fait qu'éviter qu'un visiteur non connecté atterrisse sur une page inutile pour lui ; il ne protège rien qui compte.

**Pédagogie** : un `CanActivateFn` est une fonction (remplaçant l'ancienne interface `CanActivate` à implémenter sur une classe) exécutée par le routeur avant d'activer une route. Elle retourne `true`, `false`, ou une `UrlTree` (ici `router.parseUrl('/login')`) pour rediriger. C'est un filtre côté client — jamais une garantie de sécurité, uniquement une garantie d'ergonomie.

**Anecdote instructive** (commit `4c725db`) : la première version du guard bloquait toute l'application, `/admin` compris, en le plaçant au niveau du composant racine plutôt que sur les routes une par une. Le bug n'a été détecté qu'en testant réellement dans un navigateur, pas en relisant le code — d'où la règle de toujours vérifier une fonctionnalité UI en conditions réelles avant de la considérer terminée.

## Consommation de l'API & gestion des environnements

Chaque service (`PlayerService`, `MatchdayService`, `PredictionService`, `RankingService`) est un singleton (`@Injectable({ providedIn: 'root' })`) injecté avec `inject(HttpClient)`, qui expose l'état sous forme de **signals** (`signal<T>()`) plutôt que d'`Observable` exposés tels quels.

**Pédagogie** : `providedIn: 'root'` fait du service un singleton partagé par toute l'application (une seule instance, créée à la demande) — c'est l'équivalent moderne de déclarer un provider dans un module racine. Un `signal` est une primitive de réactivité fine-grained introduite par Angular : lire `player.currentPlayer()` dans un template ré-exécute uniquement les parties du DOM qui en dépendent, sans passer par `async` pipe ni `ChangeDetectorRef`.

L'URL de l'API n'est jamais codée en dur dans les services : elle vient de `environment.apiUrl`, avec trois fichiers :

| Fichier               | Rôle                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment.ts`      | valeur par défaut, utilisée par `nx serve` en développement local (`http://localhost:3333/api`)                                                                              |
| `environment.dev.ts`  | placeholder (`https://REPLACED_AT_DEPLOY_TIME/api`), écrasé par le workflow GitHub Actions juste avant `nx build --configuration=dev` avec l'URL réelle sortie par Terraform |
| `environment.prod.ts` | même mécanisme pour `--configuration=production`                                                                                                                             |

Le remplacement de fichier au build est déclaré dans `project.json` via `fileReplacements` :

```json
"fileReplacements": [{ "replace": ".../environment.ts", "with": ".../environment.dev.ts" }]
```

**Pédagogie** : `fileReplacements` est une fonctionnalité du builder Angular qui substitue littéralement un fichier source par un autre selon la configuration de build choisie (ici `dev` vs `production` vs le défaut). C'est purement statique — il n'y a pas de variable d'environnement lue au runtime dans le navigateur, tout est figé dans le bundle JS au moment du build. D'où le piège rencontré dans le commit `245a821` : un déploiement manuel qui saute l'étape "injecter la vraie URL" laisse le placeholder dans le bundle et casse silencieusement tous les appels réseau — un bug découvert seulement en ouvrant le site déployé dans un vrai navigateur.

## Logique métier côté front

### Statut d'une journée (upcoming / active / locked)

`MatchdayService.getStatus()` recalcule le statut **côté client**, purement à partir de la date de la journée et de l'horloge du navigateur :

- `UPCOMING` avant le lundi de la semaine des matchs ;
- `ACTIVE` du lundi au samedi midi ;
- `LOCKED` après samedi midi (commit `dc6b248` — la fenêtre était initialement calée sur vendredi 23:59, changée pour coller à l'horaire réel des matchs qui démarrent le samedi).

**Important** : ce calcul frontend est **indicatif seulement**, il sert à afficher l'état et à verrouiller l'UI (masquer les boutons de saisie). La règle qui compte réellement est réappliquée côté backend à chaque écriture de pronostic (`docs/backend.md`) — sans ça, un utilisateur pourrait contourner le verrouillage en modifiant le JS chargé dans son navigateur. Le commit `5a12302` a d'ailleurs révélé un bug où le backend gardait encore l'ancien horaire (vendredi 23:59) après que le front soit passé à samedi midi : les pronostics étaient silencieusement rejetés côté serveur entre vendredi soir et samedi midi. Ça illustre bien pourquoi une règle métier dupliquée entre deux couches doit être changée aux deux endroits à la fois.

### Score d'un pronostic

`ScoringService.scoreMatch()` réplique côté front — pour affichage immédiat — le même barème que le backend calcule pour le classement officiel :

- 0 point si le match n'a pas encore de résultat, ou si l'issue prédite est fausse ;
- 3 points pour une issue correcte (victoire), **4 points pour un nul correctement prédit** (plus difficile à deviner, valorisé depuis le commit `5a12302`) ;
- +1 point par bonus (offensif / défensif) correctement prédit, mais **seulement si l'issue elle-même est correcte** — un bonus juste sur un pronostic d'issue faux ne rapporte rien.

C'est une duplication volontaire et acceptée du calcul : le frontend l'utilise pour afficher "MON TOTAL J{n}" et le surlignage vert d'un pronostic correct sans attendre un aller-retour réseau supplémentaire, mais le classement affiché sur `/ranking` vient bien du backend (source de vérité).

### Page `/admin` — saisie des résultats

Ajoutée par le commit `12a10a0` pour débloquer toute la boucle pronostic → score → classement, restée inerte jusque-là faute d'un endroit où saisir `Match.result`. Réutilise volontairement le même pattern visuel que `MatchdayComponent` (boutons DOM/NUL/EXT, cases à cocher bonus) pour ne pas réinventer un second style d'interaction. Aucune protection par guard (voir section Authentification), et un signal local `savedId` affiche une coche ✓ pendant 2 secondes après une sauvegarde réussie — corrigé une fois (commit `245a821`) pour que la coche ne s'affiche qu'après confirmation réelle du serveur (`onDone(success)` dans le callback de `subscribe`), pas de façon optimiste dès l'envoi de la requête.

## Direction artistique

Le style "arcade vintage" (référence Jonah Lomu Rugby 1997, `SPEC.md`) est implémenté avec des **CSS custom properties** globales dans `styles.css` :

```css
:root {
  --bg: #0e0e12;
  --gold: #e8c84a;
  --red: #c0392b;
  --muted: #666676;
  --border: #2a2a38;
}
```

Chaque composant réutilise ces variables dans ses styles (`styles: [...]` en ligne dans le décorateur `@Component`, pas de fichiers `.css` séparés) — c'est un choix de compacité pour un projet de cette taille, pas une contrainte technique. Deux polices Google Fonts (`Barlow Condensed` en 900 pour les titres/boutons, `Barlow` pour le texte courant) donnent le côté condensé/typo bold "arcade". Il n'y a pas de framework CSS (pas de Tailwind, pas de composants Material) : tout est écrit à la main, cohérent avec l'esprit "dense, sans blancs excessifs" demandé par la spec.

Le header (`app.ts`) est responsive avec un point de rupture unique à 640px (`cff458f` — corrige un débordement du nom du joueur sur petit écran en faisant passer les liens de nav sur une seconde ligne).

### Blasons d'équipe

Chaque nom d'équipe (`match.homeTeam` / `match.awayTeam`, une simple `string` — voir `Match` dans `packages/shared/models`) est maintenant accompagné d'un petit blason SVG, sur `/matchday/:id` et `/admin`, pour rendre les cartes de match plus lisibles d'un coup d'œil qu'une liste de noms de club.

Le modèle de données n'a **pas** été modifié pour ça : il n'y a pas de champ `logoUrl` sur `Match`, pas de nouvelle entité `Team` côté backend. Le mapping nom → visuel vit entièrement côté frontend :

- `apps/oh-rugby/src/app/data/team-visuals.ts` — un dictionnaire `nom d'équipe → slug` (les 14 clubs du TOP 14, calé sur les libellés exacts utilisés dans `apps/back-oh-rugby/src/data/matchdays.seed.ts`) et une fonction `teamLogoUrl()` qui renvoie `/logos/{slug}.svg`, ou `/logos/default.svg` si le nom ne correspond à aucune clé connue (pas d'erreur ni de `<img>` cassée pour une équipe future non répertoriée).
- `apps/oh-rugby/src/app/pipes/team-logo.pipe.ts` — pipe standalone `teamLogo`, même pattern que `FormatDatePipe` : `{{ match.homeTeam | teamLogo }}` dans un template plutôt qu'un appel de méthode sur le composant.
- `apps/oh-rugby/public/logos/*.svg` — 14 blasons + `default.svg`, servis tels quels (le dossier `public/` est copié à la racine du build par `fileReplacements`/`assets` dans `project.json`, `glob: "**/*"`).

**Pourquoi des blasons générés plutôt que les vrais logos des clubs** : les crests officiels du TOP 14 sont des marques déposées (vérifié explicitement dans les CGU de la LNR, `lnr.fr/page/cgu` : toute utilisation des marques/logos des clubs membres est soumise à autorisation préalable et expresse), pas question de les héberger dans ce repo — encore moins de les servir publiquement une fois déployé sur CloudFront. Chaque blason est donc une forme d'écusson générique (même tracé SVG pour les 14), rempli d'une couleur inspirée du maillot du club (ex. jaune et noir pour La Rochelle, rouge et noir pour Toulouse) et des initiales (2 à 4 lettres, ex. `UBB`, `ASM`, `RCT`) — suffisant pour identifier une équipe au coup d'œil dans une liste, sans reproduire une marque. Pour la même raison, le design reste volontairement **générique** : pas de reprise de la forme ou des motifs distinctifs d'un vrai blason (ex. les éclairs du Stade Français), même redessinés à la main — une ressemblance forte pose le même risque qu'une copie du fichier.

**Génération** : les 15 SVG ne sont pas dessinés à la main mais produits par `apps/oh-rugby/scripts/generate-team-logos.mjs` (script Node autonome, non branché sur le build). Il contient le tableau `TEAMS` (`slug`, `short`, `color`, `text`) et un unique tracé de blason (`SHIELD_PATH`) réutilisé pour tous. Pour changer une couleur, ajouter une équipe (promotion/relégation Top 14 ↔ Pro D2) ou régénérer les fichiers après une modification du tracé :

```bash
node apps/oh-rugby/scripts/generate-team-logos.mjs
```

Le script écrase les SVG existants dans `apps/oh-rugby/public/logos/` — il n'y a rien à committer manuellement à part le résultat.

**Intégration dans les templates** : `MatchdayComponent` et `AdminComponent` affichent chacun un `<img class="team-logo" [src]="match.homeTeam | teamLogo" [alt]="match.homeTeam">` à côté du nom, dans le même `<span class="team">` qui portait déjà le nom seul. Le `<span>` est passé en `display: flex` pour aligner logo et texte (logo après le texte côté domicile pour rester collé au centre du match-up, avant le texte côté extérieur) — un détail purement visuel, aucune logique nouvelle.

## Tests

Jusqu'au commit `2432d97`, `apps/oh-rugby` n'avait **aucun** fichier `*.spec.ts`, ce qui faisait échouer `nx test` (exécuté par le pipeline de déploiement) avec "No test files found". Deux correctifs :

1. `passWithNoTests: true` dans la config Vitest (`vite.config.mts`), par cohérence avec le reste du monorepo — un projet sans tests ne doit pas faire échouer CI, mais on préfère quand même en avoir.
2. Ajout de vrais tests unitaires, mais **seulement pour les deux morceaux de logique sans dépendance à l'injection de dépendances Angular** : `FormatDatePipe` et `ScoringService`. Un test de composant Angular nécessiterait `TestBed` (harnais de test qui simule l'environnement Angular — DI, détection de changement, rendu du template), plus lourd à mettre en place et pas fait ici faute de temps/priorité.

**Pédagogie** : `FormatDatePipe` et `ScoringService` sont des **fonctions pures** — testables en les instanciant directement (`new ScoringService()`) sans `TestBed`, sans mock, sans DOM. C'est le type de code le moins coûteux à tester unitairement, ce qui explique pourquoi il a été couvert en premier plutôt que les composants (pages) qui mêlent état, HTTP et rendu.

Aucun test d'intégration (composant + service + HTTP mocké) ni end-to-end n'existe côté front à ce jour.

## Choix explicitement écartés / dette connue

- **Pas de vraie authentification** — voir section dédiée ; explicitement hors périmètre V1 (`SPEC.md`).
- **Pas de gestion d'erreurs UI** : tous les services font `console.error(...)` dans le `error` du `subscribe` HTTP et s'arrêtent là — aucun message affiché à l'utilisateur en cas d'échec réseau (`TODO.md`, Phase 4 : "Gérer les états de chargement et les erreurs dans l'UI" reste non coché).
- **Pas d'indicateur de chargement** : aucun spinner ni état "loading" pendant les appels HTTP (hormis le bouton "..." de `/login`).
- **Duplication du calcul de statut de journée et du scoring** entre front et back, assumée pour l'instant (affichage réactif immédiat) mais qui a déjà causé un bug de désynchronisation (`5a12302`) — à surveiller à chaque futur changement de règle métier.
- **`nx-welcome.ts`** : fichier mort, jamais importé, laissé en place sans conséquence.
