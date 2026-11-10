# GitBean

GitBean is a Next.js recipe repository for specialty coffee. Recipes can be forked into new branches, their brew parameters compared in a side-by-side diff, and each change saved with a required commit message.

## Run with Docker (recommended)

Docker Compose starts Next.js, PostgreSQL 17, and Redis 7. The app waits for healthy services and applies Prisma migrations before serving traffic.

```sh
docker compose up --build -d
docker compose exec app node prisma/seed.mjs
```

Open <http://localhost:3000>. To inspect PostgreSQL with Adminer, start the tools profile:

```sh
docker compose --profile tools up --build -d
```

Adminer is at <http://localhost:8080> (server `db`, database/user/password from `.env`, defaults `gitbean`). Set `POSTGRES_PASSWORD` in `.env` before sharing or deploying. The app container runs as an unprivileged user with a read-only root filesystem and dropped Linux capabilities.

## Run locally

Use Node.js 22 and PostgreSQL. Copy `.env.example` to `.env`, then install and migrate:

```sh
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

For local schema iteration, use `npm run db:migrate -- --name describe_change`. Set `REDIS_URL` to enable the short-lived recipe list cache; if Redis is unavailable, the app continues against PostgreSQL without cache. Database access uses Prisma's PostgreSQL driver adapter.

## Recipe API

- `GET /api/recipes` lists recipes with fork parent and fork count.
- `POST /api/recipes` creates a master recipe or a fork. It validates required fields, pour steps, supported methods/roasts, and parent existence. Every new record requires an explanatory `commit_message`.

The UI starts with sample recipes if the database is offline and switches to persisted records when the API becomes available. In that case, saving requires PostgreSQL to be running.

## Exam architecture

- Multi-stage Docker build outputs Next.js standalone server.
- PostgreSQL data and Redis append-only storage use named volumes.
- PostgreSQL, Redis, and app have healthchecks; Adminer is only started with profile `tools`.
- Prisma schema and initial migration live in `prisma/`.
