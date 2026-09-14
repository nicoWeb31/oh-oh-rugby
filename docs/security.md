# Sécurité — état des lieux et pistes

Vue transversale qui ne rentre dans aucun des trois autres docs pris isolément
(`docs/frontend.md`, `docs/backend.md`, `docs/infra.md`) : ce qui protège déjà
l'app aujourd'hui, ce qui ne la protège pas, et pourquoi c'est un compromis
assumé plutôt qu'un oubli — à l'échelle actuelle (un petit groupe de joueurs
connus), pas à l'échelle d'une exposition publique.

## En bref

L'app n'a pas de vraie authentification (un code statique par joueur, voir
`docs/backend.md`), et sa plus grosse faille concrète est que la route
d'enregistrement des résultats (`/admin`) n'a **aucune** protection, pas même
ce code — n'importe qui avec l'URL peut fausser le classement de tout le
monde. Le reste des protections en place (verrouillage des règles métier
côté serveur, throttling API Gateway, buckets S3 privés derrière CloudFront,
chiffrement DynamoDB par défaut) est correct pour le contexte, mais il manque
des filets bon marché : headers de sécurité HTTP, scan automatique des
dépendances vulnérables, et CORS toujours grand ouvert.

## Ce qui protège déjà l'app aujourd'hui

- **Toute règle métier qui compte est revérifiée côté serveur** (verrouillage
  d'une journée, validité d'un pronostic) — jamais fait confiance au JS
  Angular, qui peut être contourné par n'importe qui appelant l'API
  directement. Détaillé dans `docs/backend.md`.
- **Le code d'accès joueur n'est jamais exposé** par l'API (`toPublicPlayer()`
  le retire systématiquement) et a une entropie correcte : 11 caractères
  alphanumériques (ex. `PD682446BA0`), soit largement assez pour résister à
  une tentative de devinette manuelle — ce n'est pas le maillon faible.
- **Throttling global** (API Gateway 15 req/s, burst 40, + `reserved_concurrent_executions`
  Lambda à 10) contre un script qui boucle ou un pic accidentel — voir
  `docs/infra.md`.
- **Buckets S3 entièrement privés** (`block_public_*` sur les deux buckets,
  site et logs) : seul CloudFront peut lire le contenu, via un **Origin
  Access Control** (OAC) — un mécanisme qui signe les requêtes que CloudFront
  fait vers S3, pour qu'un accès direct à l'URL S3 (en contournant
  CloudFront) soit refusé. Sans ça, n'importe qui connaissant le nom du
  bucket pourrait lire les fichiers directement sur `s3.amazonaws.com`.
- **DynamoDB chiffré au repos par défaut** (chiffrement géré par AWS,
  activé automatiquement sur toute table depuis 2018 — rien à configurer).
- **Le state Terraform** (bucket `oh-rugby-tfstate-*`) est privé, chiffré
  (SSE-S3) et versionné — une erreur d'`apply` ou une suppression accidentelle
  n'efface pas l'historique.
- **Les vraies données de `prod` sont protégées contre le seed et contre un
  `terraform destroy`** : le workflow de seed ne propose plus `prod` comme
  cible, et la table DynamoDB a `prevent_destroy = true`. Détail dans
  `infra/terraform/README.md` (section "Seed DynamoDB — fonctionnement et
  garde-fous").
- **Les policies IAM de déploiement sont scopées** au préfixe `oh-rugby-{env}`
  pour DynamoDB/Lambda/S3/logs (sauf API Gateway/CloudFront, limite
  structurelle d'IAM déjà documentée dans `docs/infra.md`).

## Failles connues, par priorité

### Priorité haute — gros risque, effort minime

**1. `PUT /api/matches/:matchId/result` (`/admin`) sans aucune protection.**
Contrairement à `PUT /api/predictions/:matchId` (qui exige le code du
joueur), cette route ne vérifie rien : ni code, ni origine, ni rien.
N'importe qui connaissant l'URL de l'API peut enregistrer un faux résultat
de match, ce qui fausse le score et le classement de **tous** les joueurs, pas
seulement du tricheur. C'est la faille la plus visible du projet parce que
c'est la seule qui permet à un tiers d'affecter les autres, plutôt que de
seulement se faire du tort à lui-même.
→ _Piste_ : exiger un code dédié (`ADMIN_CODE`, variable d'env Lambda),
vérifié comme le code joueur — même mécanisme, même niveau de garantie
("frein", pas authentification forte), coût d'implémentation minime.

**2. Aucun header de sécurité HTTP sur les réponses de l'API.**
Express ne pose aujourd'hui ni `X-Content-Type-Options`, ni
`X-Frame-Options`, ni `Content-Security-Policy`, etc. **Pédagogie** : ces
en-têtes ne bloquent pas une attaque à eux seuls, ils réduisent la surface
d'attaques qui _dépendent_ du navigateur de la victime (un navigateur qui
"devine" un type MIME différent de celui déclaré, une page tierce qui
embarque l'app dans une `<iframe>` invisible pour du clickjacking). Sans
authentification forte, ce sont des protections en profondeur peu coûteuses
à ajouter.
→ _Piste_ : middleware `helmet` sur l'app Express — une ligne, aucun risque
de régression.

**3. Pas de détection automatique des dépendances vulnérables.**
Ni Dependabot, ni `npm audit` dans `ci.yml`, ni CodeQL. Une CVE publiée sur
une dépendance npm du projet (Express, aws-sdk, etc.) ne serait jamais
signalée automatiquement — il faudrait la découvrir par hasard.
→ _Piste_ : un fichier `.github/dependabot.yml` (alertes + PR de mise à jour
automatiques) — configuration pure, aucun coût d'exécution CI.

### Priorité moyenne

**4. CloudFront ne renvoie aucun header de sécurité sur le frontend** (CSP,
HSTS, X-Frame-Options) — même raisonnement que le point 2, mais côté
distribution statique plutôt que côté API.
→ _Piste_ : attacher la policy managée AWS `Managed-SecurityHeadersPolicy` à
la distribution CloudFront (`aws_cloudfront_response_headers_policy`),
zéro maintenance.

**5. `/api/auth/verify` n'a pas de throttle dédié**, seulement le throttle
global de l'API (point commun avec toutes les autres routes). L'entropie du
code (~57 bits) rend un brute-force pratiquement infaisable même sans ça,
mais un throttle spécifique et plus strict sur cette route précise serait une
ceinture-bretelles à coût nul.

**6. CORS toujours ouvert** (`ALLOWED_ORIGINS` non défini) et **clés IAM
statiques pour l'authentification CI→AWS** plutôt qu'OIDC — déjà documentés
en détail dans `docs/infra.md` et `docs/backend.md`, pas de nouveauté ici,
simple rappel de leur présence dans le paysage sécurité global.

### Non prioritaire à l'échelle actuelle

- **WAF** devant API Gateway, **quotas par IP/utilisateur** — utile contre un
  abus ciblé ou distribué, hors de portée d'un petit groupe de joueurs
  connus.
- **Domaine personnalisé + certificat ACM** — pas un enjeu de sécurité en soi
  (le certificat par défaut `*.cloudfront.net` est bien en HTTPS), juste
  différé faute de nom de domaine acheté (voir `docs/infra.md`).

## Pourquoi ces choix sont assumés, pas des oublis

Le fil conducteur du projet (voir `SPEC.md`, "Hors Périmètre Immédiat") est
un MVP pour un groupe d'amis, pas une application exposée publiquement. La
plupart des lacunes ci-dessus ont un coût de correction très inférieur à
leur risque réel _à cette échelle_ — ce qui justifie de les documenter et de
les reporter, plutôt que de les corriger dans l'urgence. Le signal qui doit
déclencher leur traitement n'est pas "un jour on aura le temps", mais un
changement concret de contexte : ouverture à des joueurs qu'on ne connaît
pas personnellement, ou données à protéger qui n'existent pas encore
aujourd'hui.
