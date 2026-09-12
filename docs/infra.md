# Infrastructure — pourquoi c'est fait comme ça

Ce document explique les **choix d'architecture et de conception** de l'infra
AWS/Terraform/CI, et le raisonnement derrière chacun. Pour la **procédure
opérationnelle** (bootstrap, déploiement, secrets GitHub, commandes de
dépannage), voir `infra/terraform/README.md` — ce document ne la répète pas.

## En bref

Terraform gère l'infra AWS (DynamoDB, Lambda, API Gateway, S3, CloudFront) pour deux environnements isolés (`dev`/`prod`), mais **ne déploie jamais le code applicatif** : la Lambda est créée avec un simple placeholder, et GitHub Actions pousse le vrai code séparément à chaque push — ce qui évite un `apply` complet à chaque commit. Un bootstrap Terraform à part, exécuté une seule fois manuellement, résout le problème "il faut de l'infra pour stocker l'état Terraform, avant même de pouvoir créer de l'infra". Les environnements `dev`/`prod` sont isolés par des fichiers de config séparés plutôt que par les workspaces natifs de Terraform, pour rendre plus difficile de toucher `prod` par erreur. Deux vrais bugs IAM et un bug de bundling Lambda (qui ressemblait à tort à un problème CORS) sont détaillés comme cas d'école. Un throttle global (API Gateway + concurrence Lambda) protège contre un script qui boucle, sans être une vraie protection anti-abus. Dette assumée pour l'instant : authentification CI→AWS par clés statiques plutôt qu'OIDC, CORS ouvert, pas de domaine personnalisé ni de WAF.

## Vue d'ensemble

```
GitHub Actions (push develop/main)
        │
        ├── terraform apply ─────────► AWS (Lambda, API Gateway, DynamoDB, S3, CloudFront)
        │
        ├── aws lambda update-function-code ──► code du backend Express
        │
        └── aws s3 sync + cloudfront invalidation ──► code du frontend Angular
```

Cinq modules Terraform, assemblés dans `infra/terraform/main.tf` :
`dynamodb`, `lambda`, `api_gateway`, `static_site` (S3 + CloudFront). Chacun
ne connaît que ses propres ressources et reçoit les ARNs dont il a besoin en
entrée (ex. `lambda` reçoit `dynamodb_table_arn` pour écrire sa policy IAM) —
c'est la structure classique d'un IaC un peu plus gros qu'un seul fichier :
un module = une responsabilité, le fichier racine fait le câblage.

## Le problème du bootstrap (poule et œuf)

Terraform a besoin d'un **backend distant** pour stocker son état
(`terraform.tfstate`) : sans ça, l'état vit en local et deux personnes (ou
deux runs CI) qui appliquent en même temps se marchent dessus, ou pire,
perdent l'état si la machine qui l'a produit disparaît. Le backend choisi ici
est classique : un bucket **S3** pour le fichier d'état, une table
**DynamoDB** pour le verrou (empêche deux `apply` concurrents).

Problème : ce bucket S3 et cette table DynamoDB sont eux-mêmes de
l'infrastructure — il faudrait du Terraform pour les créer, mais ce
Terraform-là n'a pas encore de backend où stocker _son_ propre état. D'où
`infra/terraform/bootstrap/` : une configuration Terraform **séparée**, dont
l'état reste local (ou du moins n'a pas besoin du backend qu'elle crée), et
qui ne s'exécute qu'**une seule fois, manuellement** (voir le README pour la
commande). Elle crée :

- le bucket de state (`oh-rugby-tfstate-{account_id}`) et la table de lock
  (`oh-rugby-tf-locks`) ;
- deux utilisateurs IAM (`oh-rugby-dev-deploy`, `oh-rugby-prod-deploy`) avec
  une clé d'accès chacun, que GitHub Actions utilisera pour s'authentifier.

Le Terraform "principal" (`infra/terraform/` racine) référence ensuite ce
backend via `backend.tf`, mais **sans** y coder en dur le bucket/la région :

```hcl
terraform {
  backend "s3" {}
}
```

Les valeurs concrètes sont fournies au moment du `terraform init
-backend-config=envs/dev.backend.hcl`. Ce découplage permet à la même
configuration Terraform de pointer vers le state `dev` ou le state `prod`
selon le fichier passé — voir la section suivante.

## Isolation des environnements : fichiers plutôt que workspaces

Terraform propose un mécanisme natif pour gérer plusieurs environnements avec
une seule configuration : les **workspaces** (`terraform workspace new dev`).
Ce projet ne les utilise pas. À la place : un couple de fichiers par
environnement dans `infra/terraform/envs/` — `dev.tfvars` + `dev.backend.hcl`,
et pareil pour `prod`.

Pourquoi ce choix plutôt que les workspaces natifs : les workspaces partagent
le **même** fichier de state avec des clés différentes en interne, ce qui
rend facile une erreur du type "je suis sur le workspace dev mais je pensais
être sur prod" (un simple `terraform workspace select` mal tapé). Avec un
fichier `.backend.hcl` par environnement, l'isolation est **explicite et
visible dans la commande elle-même** (`-backend-config=envs/prod.backend.hcl`) :
c'est plus verbeux, mais il est structurellement plus difficile de toucher
`prod` par accident depuis un terminal qu'on croit être sur `dev`. C'est un
compromis "sécurité par la friction" assez courant sur des projets à deux
environnements où le native workspace n'apporte pas grand-chose (pas de
dizaines d'environnements ici).

## Séparation infra ↔ code applicatif

Un point de conception central : **`terraform apply` ne déploie jamais le
code métier**. Le module `lambda` package un simple fichier
`modules/lambda/placeholder/index.js` en zip et le déploie comme
`aws_lambda_function`. Le vrai code (le bundle Express buildé par Nx) est
poussé séparément par le workflow GitHub Actions via `aws lambda
update-function-code`, et le frontend via `aws s3 sync`.

Pourquoi séparer les deux : si le code applicatif faisait partie du plan
Terraform, **chaque commit de code** (un changement de route Express, un
correctif CSS) déclencherait un `terraform plan/apply` complet sur toute
l'infra — plus lent, plus risqué (un apply touche potentiellement aussi les
ressources IAM/réseau), et le state Terraform grossirait avec des hash de zip
à chaque commit. En séparant, Terraform ne tourne que quand la _forme_ de
l'infra change (nouvelle variable d'env sur la Lambda, nouveau module...),
et le déploiement de code est une opération plus légère et plus fréquente
(AWS CLI direct, pas de plan Terraform à recalculer).

Le point technique qui rend ça possible : le bloc

```hcl
lifecycle {
  ignore_changes = [filename, source_code_hash]
}
```

sur la ressource `aws_lambda_function`. Sans ça, le prochain `terraform
apply` détecterait que le code réel déployé par CI diverge du placeholder
zippé par Terraform, et **écraserait le vrai code par le placeholder** —
remettant la Lambda dans un état cassé. `ignore_changes` dit explicitement à
Terraform "ne considère pas ce champ comme faisant partie de l'état désiré,
peu importe ce qui a été appliqué en dehors de moi".

## Pipeline CI/CD (GitHub Actions)

Trois fichiers de workflow, organisés pour éviter la duplication :

- `deploy.yml` est un **workflow réutilisable** (`workflow_call`) : il prend
  un seul paramètre (`environment: dev|prod`) et fait tout le travail —
  lint/test, `terraform apply`, build backend, push Lambda, injection de
  l'URL d'API dans l'environnement Angular, build frontend, sync S3,
  invalidation CloudFront.
- `deploy-dev.yml` (déclenché sur push `develop`) et `deploy-prod.yml`
  (déclenché sur push `main`) ne font qu'**appeler** `deploy.yml` avec le bon
  paramètre.

C'est le pattern DRY classique des workflows GitHub Actions : sans ça, il
faudrait maintenir deux fichiers quasi identiques (dev et prod), avec le
risque qu'ils divergent silencieusement avec le temps (un step ajouté à l'un,
oublié dans l'autre). Le `secrets: inherit` sur l'appel transmet les secrets
de l'environnement GitHub ciblé (`dev` ou `prod`) au workflow appelé.

`ci.yml`, plus simple, tourne sur chaque push/PR : format, lint, test, build,
typecheck, e2e via `nx run-many` — c'est la vérification "le code compile et
passe ses tests", indépendante de tout déploiement.

### Injection de l'URL d'API par environnement

Le frontend Angular a besoin de connaître l'URL de l'API à la compilation
(Angular remplace `environment.ts` par `environment.<config>.ts` au build via
`fileReplacements`, un mécanisme statique — pas de variable lue au runtime
dans le navigateur). Comme cette URL n'existe qu'une fois la Lambda et l'API
Gateway déployés par Terraform, le workflow lit l'output Terraform
(`api_url`) **après** l'`apply`, puis génère le fichier
`environment.<env>.ts` à la volée avant de lancer le build Angular. C'est
pour ça que l'ordre des étapes dans `deploy.yml` est contraint : Terraform
d'abord, build frontend ensuite.

### Invalidation CloudFront

Après chaque `aws s3 sync`, le workflow appelle `aws cloudfront
create-invalidation --paths "/*"`. CloudFront est un CDN : il garde des
copies mises en cache des fichiers du bucket S3 sur ses points de présence
dans le monde, pour éviter de retourner à S3 à chaque requête. Sans
invalidation explicite, les utilisateurs continueraient à recevoir l'ancienne
version du site (JS/CSS/HTML) depuis le cache jusqu'à expiration naturelle du
TTL — potentiellement longtemps. Le `--paths "/*"` invalide tout le cache
d'un coup ; sur une petite app comme celle-ci, le coût (un peu de latence
tant que le cache se reconstruit) est négligeable face à la simplicité.

### Seed manuel plutôt qu'automatique — et plus du tout possible sur `prod`

`seed-dynamodb.yml` est un `workflow_dispatch` — déclenché manuellement dans
l'onglet Actions, jamais automatiquement à chaque déploiement. Raison
documentée dans `infra/terraform/README.md` : le script de seed **écrase**
les items existants. Si un déploiement le relançait automatiquement à chaque
push, il effacerait silencieusement les vrais pronostics des joueurs dès
qu'un déploiement suivrait une saisie réelle. Un déclenchement manuel n'est
pas une négligence ici — c'est un garde-fou volontaire sur une opération
destructive.

Depuis que `prod` contient de vraies données de joueurs, ce garde-fou seul ne
suffisait plus : un déclenchement manuel reste un clic dans un menu, et un
menu qui propose encore `prod` reste un piège attendant un clic malheureux.
Deux protections supplémentaires ont donc été ajoutées :

- le menu `workflow_dispatch` ne propose plus `prod` comme choix — `dev`
  uniquement (`options: [dev]`). Un commentaire dans le fichier explique
  pourquoi et comment réactiver `prod` si un vrai reset de données devait un
  jour être nécessaire (modification volontaire et ponctuelle du fichier,
  jamais une option qui reste disponible en permanence).
- `modules/dynamodb/main.tf` porte désormais `lifecycle { prevent_destroy =
true }` sur la table. **Pédagogie** : ce méta-argument Terraform fait
  échouer tout `plan`/`apply`/`destroy` qui impliquerait de supprimer la
  ressource — utile en complément du point précédent, parce qu'il protège
  contre une tout autre catégorie d'erreur (un changement de schéma
  Terraform qui forcerait un remplacement de la table), pas seulement contre
  un mauvais choix dans un menu. Terraform interdit qu'un tel réglage dépende
  d'une variable (`var.env == "prod"` est explicitement rejeté par
  `terraform validate` — ce méta-argument doit être un littéral) ; il
  s'applique donc aussi à `dev`, qui n'en a pas vraiment besoin mais n'en
  souffre pas non plus.

## Sécurité & IAM

### Clés statiques plutôt qu'OIDC

GitHub Actions s'authentifie auprès d'AWS avec des **clés IAM statiques**
(`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` en secrets GitHub), pas avec
OIDC (un mécanisme où GitHub Actions obtient un jeton temporaire signé,
qu'AWS échange contre des credentials de courte durée via un rôle IAM, sans
qu'aucun secret longue durée ne soit stocké nulle part). Le commentaire dans
`bootstrap/modules/deploy_user/main.tf` le dit explicitement : OIDC est
préférable en théorie ("avoids long-lived keys entirely") mais n'est pas ce
qui est câblé.

Le compromis assumé : les clés statiques sont plus simples à mettre en place
(pas de configuration de trust policy OIDC ni de fournisseur d'identité IAM à
créer) mais plus risquées — une clé qui fuite (log, commit accidentel,
repo compromis) reste valide jusqu'à révocation manuelle. `infra/terraform/README.md`
documente déjà la nécessité de les faire tourner périodiquement. C'est une
dette technique volontaire et documentée, adaptée à la taille actuelle du
projet — mais la première chose à durcir avant une exposition plus large.

### Les deux bugs IAM comme cas d'école

Deux commits (`fa0171d`, `cd061c7`) corrigent une même classe d'erreur, bonne
à comprendre pour tout troubleshooting IAM futur : **certaines actions AWS
n'ont pas de ressource unique à cibler**, et IAM refuse de les autoriser
scopées à un ARN précis — il faut les accorder sur `Resource: "*"`.

- `logs:DescribeLogGroups` (utilisé par Terraform pour _lire_ l'état d'un
  `aws_cloudwatch_log_group` existant) est un appel de **listing** : on
  demande "quels groupes de logs existent", pas "donne-moi ce groupe précis".
  IAM n'offre pas de scoping fin pour ce genre d'opération.
- `logs:CreateLogDelivery` (et sa famille Get/Update/Delete/List) est
  utilisé en coulisses quand API Gateway v2 configure ses **access logs**
  vers CloudWatch. C'est une API **cross-service** ("log delivery") qui gère
  la relation entre deux services AWS différents — pas une ressource unique
  qu'on peut nommer dans un ARN.

Dans les deux cas, le symptôme était le même : `terraform apply` échouait
avec `AccessDeniedException`/`BadRequestException` alors que la policy IAM
semblait déjà couvrir CloudWatch Logs — le piège classique étant de croire
qu'une policy scopée à un préfixe de log group (`log-group:/aws/lambda/...`)
couvre _toutes_ les actions du service, alors que certaines actions
"transversales" échappent structurellement au system de scoping par ARN.
Le réflexe utile : quand une erreur IAM porte sur une action qui ressemble à
`Describe*`, `List*`, ou une API de type "delivery"/"discovery", suspecter
d'abord qu'elle exige `Resource: "*"` plutôt que chercher le bon ARN.

### Un bug applicatif qui ressemblait à un problème d'infra

Le commit `a9d7435` mérite d'être noté ici bien qu'il touche du code
applicatif, car le symptôme observé était typiquement "une erreur d'infra" :
toutes les requêtes vers l'API déployée échouaient, et le navigateur ne
voyait qu'une erreur CORS générique. La vraie cause : le build webpack du
backend (généré par le template Nx par défaut) ne configurait pas
`output.library`, donc le bundle ne faisait jamais correctement
`module.exports = { app, handler }` — Lambda cherchait `main.handler` et
trouvait un objet vide (`Runtime.HandlerNotFound`). CloudWatch confirmait :
zéro invocation réussie avant le fix. L'erreur CORS n'était qu'un
**symptôme visible** — le navigateur affiche une erreur CORS générique
chaque fois qu'une requête échoue avant que le serveur ait pu répondre avec
les bons en-têtes, y compris quand la vraie cause est un crash côté serveur
n'ayant rien à voir avec CORS. Leçon générale : face à une erreur CORS en
prod qui n'existe pas en local, vérifier d'abord que le serveur répond
_du tout_ (logs CloudWatch, code de statut réel) avant de creuser la
configuration CORS elle-même.

### Portée des policies IAM du déploiement

La policy du déploiement (`bootstrap/modules/deploy_user/main.tf`) scope
précisément DynamoDB, Lambda, le rôle d'exécution Lambda, les buckets S3 et
les CloudWatch Log Groups au préfixe `oh-rugby-{env}` — sauf pour API Gateway
et CloudFront, où l'accès est accordé au niveau du service entier
(`apigateway:*`/`cloudfront:*` sur `Resource: "*"`). Raison documentée dans
le code : ces deux services n'exposent pas de scoping par ARN utile pour les
actions de _gestion_ (création/modification de distribution, de stage, de
route) dont Terraform a besoin — contrairement à DynamoDB ou Lambda, où les
ARN de ressource permettent un scoping fin. C'est une limite d'AWS IAM, pas
un choix de laxisme délibéré, mais le risque résiduel (l'utilisateur de
déploiement pourrait gérer _n'importe quelle_ distribution CloudFront ou API
Gateway du compte, pas seulement celles du projet) reste réel et documenté
comme tel dans `infra/terraform/README.md`.

## CORS ouvert (MVP)

La variable d'environnement `ALLOWED_ORIGINS` n'est volontairement **pas
définie** sur la Lambda (`modules/lambda/main.tf`) : le code Express
(`apps/back-oh-rugby/src/app.ts`) traite son absence comme "autoriser toutes
les origines". Pédagogiquement : CORS est un mécanisme de sécurité côté
**navigateur** (le serveur peut toujours être appelé sans CORS par n'importe
quel client non-navigateur — curl, un autre serveur) ; l'ouvrir ne crée donc
pas de faille d'accès aux données côté serveur, il rend seulement possible
qu'un site tiers fasse des requêtes cross-origin authentifiées ou non
depuis le navigateur d'un utilisateur. Sur une app sans authentification
réelle et sans données sensibles à ce stade (V1), le risque est jugé
acceptable temporairement — mais c'est explicitement listé comme "à
restreindre au domaine CloudFront réel avant une exposition plus large" dans
`SPEC.md` et `infra/terraform/README.md`.

## Limites connues / dette assumée

Reprises et expliquées ici (déjà listées dans `infra/terraform/README.md`) :

- **Clés IAM statiques** pour l'auth CI→AWS plutôt qu'OIDC — voir plus haut.
- **Policy IAM large** sur `apigateway:*`/`cloudfront:*` (`Resource: "*"`) —
  limite structurelle d'IAM sur ces deux services, pas un choix de facilité.
- **Pas de nom de domaine personnalisé / certificat ACM** : le front est
  servi sur le domaine par défaut `*.cloudfront.net`. Ajouter un domaine
  personnalisé nécessiterait un certificat ACM (obligatoirement dans
  `us-east-1` pour CloudFront, indépendamment de la région du reste de
  l'infra) et une zone DNS — reporté faute de nom de domaine acheté.
  Voir aussi `docs/security.md` pour une vue d'ensemble sécurité transversale
  (front + back + infra) classée par priorité.

- **Throttling global, pas de WAF** : le stage API Gateway limite à 15 req/s
  (burst 40), et la Lambda est plafonnée à 10 exécutions concurrentes
  (`reserved_concurrent_executions`) — deux garde-fous complémentaires contre
  un script qui boucle ou un pic accidentel, appliqués globalement à toute
  l'API (pas de quota par IP ni par utilisateur, pas de WAF). Le burst a été
  calibré sur le pattern réel du front (saisie de pronostic sans debounce,
  voir plus haut) plutôt que choisi arbitrairement. Adapté à un petit groupe
  de joueurs connus ; à revisiter avant toute exposition publique large.
- **Classement calculé à la demande, pas de GSI DynamoDB** : décisions de
  modélisation des données, expliquées dans `infra/terraform/README.md` et
  `SPEC.md` plutôt que redondées ici — ce sont des choix applicatifs plus que
  des choix d'infrastructure à proprement parler.
