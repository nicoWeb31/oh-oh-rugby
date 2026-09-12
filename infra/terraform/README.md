# Infrastructure AWS — OhRugby

Terraform gère : DynamoDB (table unique, sans GSI — voir plus bas), Lambda + rôle
d'exécution, API Gateway HTTP API (v2), S3 + CloudFront pour le frontend Angular.
Deux environnements indépendants : `dev` et `prod`, région `eu-west-3`.

Le code applicatif (backend Lambda, frontend Angular) n'est **pas** déployé par
`terraform apply` : Terraform crée l'infrastructure avec un Lambda "placeholder",
puis le pipeline GitHub Actions pousse le vrai code via `aws lambda
update-function-code` et `aws s3 sync`. Cela évite de faire rejouer un `apply`
à chaque changement de code applicatif.

## Décisions de conception (résolvent les questions ouvertes de `SPEC.md`)

- **Pas de GSI** : les patterns d'accès actuels (lire une compétition, les
  journées d'une compétition, les pronostics d'un joueur, un match par id)
  sont tous couverts par la clé primaire `PK`/`SK` en connaissant l'id de la
  ressource. Les matchs sont stockés **imbriqués** dans l'item `Matchday`
  (jamais lus indépendamment aujourd'hui), donc pas d'entité `Match` séparée
  ni d'index `MatchdayIndex`/`MatchPredictionsIndex`.
- **Classement calculé à la demande**, pas matérialisé : à l'échelle V1
  (quelques joueurs, ~182 matchs), recalculer à chaque requête est trivial et
  évite un mécanisme de mise à jour incrémentale.
- **Pas de domaine personnalisé / ACM** pour l'instant : le front est servi sur
  le domaine `*.cloudfront.net` par défaut. À ajouter plus tard si un nom de
  domaine est acheté.
- **CORS ouvert (MVP)** : `ALLOWED_ORIGINS` n'est volontairement pas défini sur
  le Lambda, donc l'API accepte toutes les origines (comportement déjà codé
  dans `app.ts` en l'absence de cette variable). À restreindre au domaine
  CloudFront réel avant d'exposer l'app plus largement.
- **Logs CloudFront → S3** : chaque environnement a son bucket de logs dédié
  (`oh-rugby-{env}-cf-logs-{account_id}`), rétention 30 jours.

## Étape unique : bootstrap (à lancer une seule fois, en local, avec vos identifiants AWS)

Le bootstrap crée le bucket S3 de state Terraform, la table DynamoDB de lock,
et deux utilisateurs IAM (`oh-rugby-dev-deploy`, `oh-rugby-prod-deploy`) avec
une clé d'accès chacun — ce sont ces clés que GitHub Actions utilise pour
s'authentifier auprès d'AWS (authentification par clés statiques, stockées en
secrets GitHub ; voir la note sécurité plus bas).

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply -var="account_id=<votre_account_id_aws>"
terraform output -raw deploy_user_dev_access_key_id; echo
terraform output -raw deploy_user_dev_secret_access_key; echo
terraform output -raw deploy_user_prod_access_key_id; echo
terraform output -raw deploy_user_prod_secret_access_key; echo
```

Remplacez ensuite `REPLACE_WITH_AWS_ACCOUNT_ID` par votre account id AWS dans :

- `infra/terraform/envs/dev.tfvars`, `envs/prod.tfvars`
- `infra/terraform/envs/dev.backend.hcl`, `envs/prod.backend.hcl`

## Configuration GitHub (une fois)

Créez deux [environnements GitHub](../../settings/environments) `dev` et
`prod` sur le repo, et dans chacun ajoutez deux **secrets** (ce sont de vraies
clés d'accès AWS, à ne jamais commiter ni logger) :

| Environnement | Secret                  | Valeur                                      |
| ------------- | ----------------------- | ------------------------------------------- |
| `dev`         | `AWS_ACCESS_KEY_ID`     | sortie `deploy_user_dev_access_key_id`      |
| `dev`         | `AWS_SECRET_ACCESS_KEY` | sortie `deploy_user_dev_secret_access_key`  |
| `prod`        | `AWS_ACCESS_KEY_ID`     | sortie `deploy_user_prod_access_key_id`     |
| `prod`        | `AWS_SECRET_ACCESS_KEY` | sortie `deploy_user_prod_secret_access_key` |

Pour `prod`, ajoutez idéalement une règle de protection (reviewers requis)
sur l'environnement GitHub, pour valider manuellement chaque déploiement
avant qu'il ne parte — le workflow `deploy-prod.yml` se déclenche
automatiquement à chaque push sur `main`, la protection d'environnement est
le seul garde-fou manuel.

**Note sécurité** : ce sont des clés AWS longue durée. Elles ne meurent
jamais toutes seules — pensez à les faire tourner (`terraform apply
-replace=module.deploy_user_dev.aws_iam_access_key.deploy` puis mettre à jour
le secret GitHub) périodiquement, et à révoquer immédiatement une clé
suspectée compromise (`aws iam delete-access-key`). L'alternative sans clé
stockée (rôle IAM assumé via OIDC GitHub) est possible mais n'est pas ce qui
est câblé ici.

## Déploiement

- Push sur `develop` → `.github/workflows/deploy-dev.yml` déploie sur `dev`.
- Push sur `main` → `.github/workflows/deploy-prod.yml` déploie sur `prod`.
- Les deux appellent le workflow réutilisable `deploy.yml` qui : lint/test le
  code, `terraform apply`, pousse le code Lambda, build le front avec l'URL
  d'API réelle injectée dans `environment.<env>.ts`, sync S3, invalide
  CloudFront.

### Seed DynamoDB — fonctionnement et garde-fous

Premier déploiement d'un environnement : la table DynamoDB est vide. Lancez
manuellement le workflow **Seed DynamoDB** (`workflow_dispatch` dans l'onglet
Actions) pour charger la compétition, les 26 journées, les joueurs et les
pronostics de démo (`apps/back-oh-rugby/src/scripts/seed.ts`).

Comment ça marche concrètement : le script construit un item DynamoDB par
compétition/journée/joueur/pronostic de démo, puis les écrit par lots de 25
(`BatchWriteItem`, la taille max acceptée par cette API DynamoDB) via des
`PutRequest`. **Un `PutRequest` remplace intégralement l'item existant à la
même clé (`PK`/`SK`)** — ce n'est pas un _merge_ : si l'item existe déjà, ses
attributs précédents sont perdus, pas fusionnés avec les nouveaux. C'est ce
qui rend le seed **destructif** : relancé sur une table qui contient déjà de
vrais pronostics de joueurs, il les écrase silencieusement par les données de
démo, sans avertissement ni confirmation.

`prod` contient désormais de vraies données de joueurs. Deux garde-fous
distincts protègent contre une perte accidentelle, à deux niveaux différents :

- **Le workflow ne propose plus `prod`** comme environnement cible
  (`.github/workflows/seed-dynamodb.yml`, `options: [dev]`) : le menu
  déroulant `workflow_dispatch` ne permet plus de le sélectionner. Ce n'est
  pas un simple oubli à corriger si besoin — un commentaire dans le fichier
  explique que réactiver `prod` doit rester un acte volontaire et ponctuel
  (modifier le fichier, lancer, annuler), jamais une option qui traîne dans
  un menu où un clic malheureux suffirait à tout écraser.
- **`terraform` refuse de supprimer ou recréer la table**
  (`modules/dynamodb/main.tf`, `lifecycle { prevent_destroy = true }`) : si
  un futur changement de schéma (renommer une clé, changer `hash_key`)
  forçait Terraform à détruire puis recréer la table, l'`apply` échouerait
  explicitement au lieu de supprimer silencieusement toutes les données.
  S'applique aux deux environnements (Terraform n'autorise pas de condition
  sur ce réglage — il doit être une valeur fixe) ; pour vraiment détruire une
  table (ex. remettre `dev` à zéro), il faut retirer ce bloc temporairement,
  appliquer, puis le remettre.
- **`point_in_time_recovery` reste le filet de secours final en `prod`** (déjà
  mentionné plus haut) : si malgré ces deux garde-fous des données étaient
  perdues ou corrompues, une restauration manuelle à un instant des 35
  derniers jours reste possible. Ça ne remplace pas les deux protections
  ci-dessus — restaurer un backup a un coût opérationnel et ne rattrape rien
  automatiquement — mais c'est un dernier recours qui existe.

## Commandes manuelles (dépannage)

```bash
cd infra/terraform
terraform init -backend-config=envs/dev.backend.hcl
terraform plan -var-file=envs/dev.tfvars
terraform apply -var-file=envs/dev.tfvars
```

## Limites connues

- Authentification GitHub Actions → AWS par **clés statiques** plutôt que par
  rôle assumé via OIDC : plus simple à mettre en place mais moins sûr (clés
  longue durée à faire tourner manuellement, présentes en clair dans le
  `terraform.tfstate` du bootstrap — le bucket de state est chiffré et privé,
  mais restez-en conscient).
- Les policies IAM des utilisateurs de déploiement (`bootstrap/modules/deploy_user`)
  accordent un accès large sur API Gateway et CloudFront (`apigateway:*`,
  `cloudfront:*`, `resources = ["*"]`) car ces services n'exposent pas de
  scoping par ARN utile pour les actions de gestion dont Terraform a besoin.
  Le reste (DynamoDB, Lambda, IAM, S3, logs) est scopé au préfixe
  `oh-rugby-{env}`.
- Throttling global sur l'API Gateway (15 req/s, burst 40) et
  `reserved_concurrent_executions = 10` sur la Lambda — un plafond volontairement
  large pour un petit groupe de joueurs, qui protège surtout contre un script
  qui boucle ou un pic accidentel, pas une vraie protection anti-abus. Le
  burst tient compte du fait que la saisie de pronostic (front) envoie une
  requête par clic sans regrouper les écritures — voir `docs/infra.md`. Pas de
  WAF ni de quota par IP/utilisateur ; à revisiter avant une exposition
  publique large.
