# OhRugby

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

Application de pronostics de rugby, construite avec Angular et une API Express destinée à AWS Lambda.

## Démarrage local

Installer les dépendances une seule fois :

```bash
npm install
```

Démarrer l'API Express dans un premier terminal :

```bash
npm exec -- nx run back-oh-rugby:serve
```

L'API répond sur `http://localhost:3333/api` ; vérifier son état avec :

```bash
curl http://localhost:3333/api/health
```

Démarrer le frontend Angular dans un second terminal :

```bash
npm exec -- nx run oh-rugby:serve
```

Arrêter l'un ou l'autre serveur avec `Ctrl+C` dans le terminal correspondant.

En local, le backend lit et écrit dans DynamoDB (voir `infra/terraform/README.md` pour le déploiement) ; sans configuration AWS locale, pointez `DYNAMODB_ENDPOINT` vers une instance DynamoDB Local ou déployez l'environnement `dev` pour tester contre de vraies données.

## Déploiement AWS

L'infrastructure (DynamoDB, Lambda, API Gateway, S3, CloudFront) est gérée par Terraform, déployée automatiquement par GitHub Actions : push sur `develop` → environnement `dev`, push sur `main` → environnement `prod`. Voir `infra/terraform/README.md` pour la procédure de bootstrap (à faire une fois, manuellement).

### API locale

| Méthode | Route                                         |
| ------- | --------------------------------------------- |
| `GET`   | `/api/health`                                 |
| `GET`   | `/api/competitions/comp1`                     |
| `GET`   | `/api/matchdays?competitionId=comp1`          |
| `GET`   | `/api/players`                                |
| `GET`   | `/api/predictions?playerId=p1&matchdayId=md5` |
| `PUT`   | `/api/predictions/:matchId`                   |
| `GET`   | `/api/ranking?competitionId=comp1`            |

Construire les applications de production :

```bash
npm exec -- nx run oh-rugby:build --configuration=production
npm exec -- nx run back-oh-rugby:build --configuration=production
```

## Vue d’ensemble

- `oh-rugby` : frontend Angular.
- `back-oh-rugby` : API Express, exécutée localement avec Node puis déployée dans AWS Lambda.
- `models` : modèles TypeScript partagés.

Documentation détaillée par thème — ce qui a été fait, pourquoi, et les concepts sous-jacents expliqués pour qui découvre le projet ou la stack :

- [`docs/frontend.md`](docs/frontend.md) — Angular : routing, fake auth, environnements, direction artistique, tests.
- [`docs/backend.md`](docs/backend.md) — Express/Lambda : adaptateur serverless-http, DynamoDB single-table, scoring, verrouillage serveur.
- [`docs/infra.md`](docs/infra.md) — Terraform/CI-CD : bootstrap, isolation des environnements, sécurité IAM, pipeline de déploiement.
- [`docs/security.md`](docs/security.md) — état des lieux sécurité transversal : ce qui protège déjà l'app, les failles connues classées par priorité, pourquoi c'est un compromis assumé.

`SPEC.md` reste la spec produit/métier (règles, modèle de données), `infra/terraform/README.md` le runbook opérationnel (bootstrap, déploiement, dépannage).

Commandes Nx utiles :

```bash
# Construire les deux applications
npm exec -- nx run-many -t build --projects=oh-rugby,back-oh-rugby

# Voir le graphe des dépendances
npm exec -- nx graph
```

## ⭐ Featured Nx Capabilities

This repository showcases several powerful Nx features:

### 1. 🔒 Module Boundaries

Enforces architectural constraints using tags. Each project has specific dependencies it can use:

- `scope:shared` - Can be used by all projects
- `scope:shop` - Shop-specific libraries
- `scope:api` - API-specific libraries
- `type:feature` - Feature libraries
- `type:data` - Data access libraries
- `type:ui` - UI component libraries

**Try it out:**

```bash
# See the current project graph and boundaries
npx nx graph

# View a specific project's details
npx nx show project shop --web
```

[Learn more about module boundaries →](https://nx.dev/docs/features/enforce-module-boundaries)

### 2. 🐳 Docker Integration

The API project includes Docker support with automated targets and release management:

```bash
# Build Docker image
npx nx run api:docker:build

# Run Docker container
npx nx run api:docker:run

# Release with automatic Docker image versioning
npx nx release
```

**Nx Release for Docker:** The repository is configured to use Nx Release for managing Docker image versioning and publishing. When running `nx release`, Docker images for the API project are automatically versioned and published based on the release configuration in `nx.json`. This integrates seamlessly with semantic versioning and changelog generation.

[Learn more about Docker integration →](https://nx.dev/docs/guides/nx-release/release-docker-images)

### 3. 🎭 Playwright E2E Testing

End-to-end testing with Playwright is pre-configured:

```bash
# Run e2e tests
npx nx run shop-e2e:e2e

# Run e2e tests in CI mode
npx nx run shop-e2e:e2e-ci
```

[Learn more about E2E testing →](https://nx.dev/docs/technologies/test-tools/playwright)

### 4. ⚡ Vitest for Unit Testing

Fast unit testing with Vite for Angular libraries:

```bash
# Test a specific library
npx nx run data:test

# Test all projects
npx nx run-many -t test
```

[Learn more about Vite testing →](https://nx.dev/docs/technologies/build-tools/vite)

### 5. 🔧 Self-Healing CI

The CI pipeline includes `nx fix-ci` which automatically identifies and suggests fixes for common issues:

```bash
# In CI, this command provides automated fixes
npx nx fix-ci
```

This feature helps maintain a healthy CI pipeline by automatically detecting and suggesting solutions for:

- Missing dependencies
- Incorrect task configurations
- Cache invalidation issues
- Common build failures

[Learn more about self-healing CI →](https://nx.dev/docs/features/ci-features/self-healing-ci)

## 📁 Project Structure

```
├── apps/
│   ├── shop/           [scope:shop]    - Angular e-commerce app
│   ├── shop-e2e/                       - E2E tests for shop
│   └── api/            [scope:api]     - Backend API with Docker
├── packages/
│   ├── shop/
│   │   ├── feature-products/        [scope:shop,type:feature] - Product listing
│   │   ├── feature-product-detail/  [scope:shop,type:feature] - Product details
│   │   ├── data/                    [scope:shop,type:data]    - Data access
│   │   └── shared-ui/               [scope:shop,type:ui]      - UI components
│   ├── api/
│   │   └── products/    [scope:api]    - Product service
│   └── shared/
│       └── models/      [scope:shared,type:data] - Shared models
├── nx.json             - Nx configuration
├── tsconfig.json       - TypeScript configuration
└── eslint.config.mjs   - ESLint with module boundary rules
```

## 🏷️ Understanding Tags

This repository uses tags to enforce module boundaries:

| Project            | Tags                         | Can Import From              |
| ------------------ | ---------------------------- | ---------------------------- |
| `shop`             | `scope:shop`                 | `scope:shop`, `scope:shared` |
| `api`              | `scope:api`                  | `scope:api`, `scope:shared`  |
| `feature-products` | `scope:shop`, `type:feature` | `scope:shop`, `scope:shared` |
| `data`             | `scope:shop`, `type:data`    | `scope:shared`               |
| `models`           | `scope:shared`, `type:data`  | Nothing (base library)       |

## 📚 Useful Commands

```bash
# Project exploration
npx nx graph                                    # Interactive dependency graph
npx nx list                                     # List installed plugins
npx nx show project shop --web                 # View project details

# Development
npx nx run shop:serve                              # Serve Angular app
npx nx run api:serve                               # Serve backend API
npx nx run shop:build                              # Build Angular app
npx nx run data:test                               # Test a specific library
npx nx run feature-products:lint                   # Lint a specific library

# Running multiple tasks
npx nx run-many -t build                       # Build all projects
npx nx run-many -t test --parallel=3          # Test in parallel
npx nx run-many -t lint test build            # Run multiple targets

# Affected commands (great for CI)
npx nx affected -t build                       # Build only affected projects
npx nx affected -t test                        # Test only affected projects

# Docker operations
npx nx run api:docker:build                        # Build Docker image
npx nx run api:docker:run                          # Run Docker container
```

## 🎯 Adding New Features

### Generate a new Angular application:

```bash
npx nx g @nx/angular:app my-app
```

### Generate a new Angular library:

```bash
npx nx g @nx/angular:lib my-lib
```

### Generate a new Angular component:

```bash
npx nx g @nx/angular:component my-component --project=my-lib
```

### Generate a new API library:

```bash
npx nx g @nx/node:lib my-api-lib
```

You can use `npx nx list` to see all available plugins and `npx nx list <plugin-name>` to see all generators for a specific plugin.

## Nx Cloud

Nx Cloud ensures a [fast and scalable CI](https://nx.dev/nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/docs/features/ci-features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/docs/features/ci-features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/docs/features/ci-features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/docs/features/ci-features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/docs/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## 🔗 Learn More

- [Nx Documentation](https://nx.dev/docs)
- [Angular Monorepo Tutorial](https://nx.dev/docs/getting-started/tutorials/angular-monorepo-tutorial)
- [Module Boundaries](https://nx.dev/docs/features/enforce-module-boundaries)
- [Docker Integration](https://nx.dev/docs/guides/nx-release/release-docker-images)
- [Playwright Testing](https://nx.dev/docs/technologies/test-tools/playwright)
- [Vite with Angular](https://nx.dev/docs/technologies/build-tools/vite)
- [Nx Cloud](https://nx.dev/nx-cloud)
- [Releasing Packages](https://nx.dev/docs/features/manage-releases)

## 💬 Community

Join the Nx community:

- [Discord](https://go.nx.dev/community)
- [X (Twitter)](https://twitter.com/nxdevtools)
- [LinkedIn](https://www.linkedin.com/company/nrwl)
- [YouTube](https://www.youtube.com/@nxdevtools)
- [Blog](https://nx.dev/blog)

# oh-oh-rugby
