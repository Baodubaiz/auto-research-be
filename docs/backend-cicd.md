# Backend CI/CD With Jenkins And Docker

This backend uses Jenkins and Docker with a Jenkins Controller + Docker Agent model.

## Branch Workflow

Use this branch flow:

```text
personal branches -> dev -> main
```

Rules:

```text
Personal branches: feature/fix work by each developer.
dev: integration and review branch. Build, lint, and test can run here, but deploy must not run.
main: release branch. Only dev can be merged into main. Deploy runs only from main.
```

Recommended repository protection:

```text
Block direct pushes to dev and main.
Require pull requests into dev.
Require pull requests from dev into main.
Require CI checks before merging.
Restrict who can merge into main.
```

## Current Model

```text
Jenkins Controller container
  - Jenkins UI
  - job configuration
  - credentials

Jenkins Agent container
  - label: docker-node
  - runs npm install/lint/test/build
  - runs docker build
  - runs docker rm/docker run to deploy the backend container
```

The backend pipeline is defined in `Jenkinsfile`.

## Required Jenkins Node

Create a Jenkins node:

```text
Name: docker-agent
Type: Permanent Agent
Remote root directory: /home/jenkins/agent
Labels: docker-node
Launch method: Launch agent by connecting it to the controller
Availability: Keep this agent online as much as possible
```

## Required Jenkins Credential

Create a Jenkins credential:

```text
Kind: Secret file
ID: auto-research-be-env
File: backend .env file
```

Do not commit `.env` to Git.

For production Compose deployments, create the environment file from the example and replace every placeholder secret:

```cmd
copy .env.production.example .env.production
```

The Jenkins secret file must include these production database variables:

```env
POSTGRES_USER=autoresearch
POSTGRES_PASSWORD=<strong-production-password>
POSTGRES_DB=autoresearch
```

## Jenkins Jobs

Review job for `dev`:

```text
Name: auto-research-be-dev
Definition: Pipeline script from SCM
SCM: Git
Repository URL: <auto-research-be repo URL>
Branch Specifier: */dev
Script Path: Jenkinsfile
```

Deploy job for `main`:

```text
Name: auto-research-be
Definition: Pipeline script from SCM
SCM: Git
Repository URL: <auto-research-be repo URL>
Branch Specifier: */main
Script Path: Jenkinsfile
```

The same `Jenkinsfile` is used for both. The deploy stage only runs on `main`.

## Pipeline Stages

The pipeline runs:

```text
Checkout
Install
Lint
Test
Build App
Build Docker Image
Deploy Container
Post cleanup
```

Deploy runs only for:

```text
main
origin/main
```

## Local App Compose

Start PostgreSQL and backend together:

```cmd
copy docker-compose.local.example.yml docker-compose.local.yml
copy .env.example .env
```

```cmd
make up
```

The backend service uses the Compose service name for the database:

```env
DATABASE_URL=postgresql://postgres:postgres@auto-research-postgres:5432/autoresearch?schema=public
```

Apply the Prisma schema from the host with `localhost`:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/autoresearch?schema=public"
npx prisma db push
```

## Verification

After a successful `main` build:

```cmd
docker ps
docker logs --tail 100 auto-research-be
```

The backend should be reachable at:

```text
http://localhost:3001/api/v1
```

## Notes

- `oxlint` is pinned to `1.58.0` because newer versions crashed in the Jenkins Docker agent with `Bus error (core dumped)`.
- The current project has `prisma/schema.prisma`, but no committed Prisma migrations or seed script.
- `.env` is ignored by Git and must be managed through Jenkins credentials.
- `docker-compose.local.yml` is ignored by Git. Commit changes to `docker-compose.local.example.yml` when the team needs shared local Compose defaults.
- `docker-compose.prod.yml` requires `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` from `.env.production` or the server environment.
