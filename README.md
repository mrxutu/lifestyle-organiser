# Lifestyle Organiser

Lifestyle Organiser is a private, household-scoped web application for managing calendars and reminders, recipes, watchlists, books, profiles, and household administration. It is responsive, installable as a PWA, and designed for always-online use.

## Stack

- Next.js 16, React 19, and TypeScript
- Tailwind CSS 4 and shadcn/ui
- Auth.js credentials authentication
- PostgreSQL with Prisma 7 and the Prisma PostgreSQL adapter
- Neon for the hosted database
- Resend for invitations and password-reset email
- Vercel Blob for recipe and book images
- Vercel for application hosting

## Prerequisites

- Node.js 20.19 or later
- npm
- An approved non-production PostgreSQL database for development
- Resend and Vercel Blob access when exercising email or image-upload features

Never point local development, tests, seeds, or `prisma migrate dev` at production.

## Installation

```bash
npm ci
npx prisma generate
```

Create an ignored `.env` file locally. Do not commit environment files or secret values. This repository deliberately has no `.env.example`.

### Environment variables

The application and its tooling use the following variable names:

- Core application: `DATABASE_URL`, `AUTH_SECRET`
- Optional separate rate-limit key: `AUTH_RATE_LIMIT_SECRET`
- Email: `RESEND_API`, `SENDER_EMAIL`, `HOSTNAME`
- Image storage: `BLOB_READ_WRITE_TOKEN`
- Database-backed tests: `TEST_DATABASE_URL`, `ALLOW_REMOTE_TEST_DATABASE`
- Optional backup destination override: `LIFESTYLE_ORGANISER_BACKUP_DIR`

`AUTH_RATE_LIMIT_SECRET` falls back to `AUTH_SECRET` when omitted. `ALLOW_REMOTE_TEST_DATABASE` is needed only after deliberately approving a remote development test database. Vercel supplies its own platform environment indicator; developers do not configure it locally.

## Database setup

First confirm that `DATABASE_URL` identifies an approved local PostgreSQL database or Neon development branch. Then apply the checked-in migrations and generate the client:

```bash
npm run db:migrate:dev
npx prisma generate
```

For a fresh development database, optional seed data can be created with:

```bash
npx prisma db seed
```

Run the seed only against a fresh or explicitly approved non-production database. It upserts the seeded users, replaces their passwords on every run, and prints newly generated credentials to the terminal. Save those credentials securely and do not include them in logs, documentation, commits, or support messages.

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a local production-mode check:

```bash
npm run build
npm start
```

Before making development changes, follow the [session backup procedure](docs/operational/SESSION_BACKUP.md):

```bash
npm run backup
git status
```

Confirm that the backup succeeds before continuing. Snapshots include local environment files and must be treated as sensitive.

## Prisma migrations

Development migrations are created and applied only against an approved non-production database:

```bash
npm run db:migrate:dev -- --name describe_change
npx prisma generate
```

Review the generated SQL and application changes together. Do not use schema-reset or data-losing commands without explicit approval.

Production uses a separate, human-controlled workflow. The production wrapper scripts read `DATABASE_URL` from the ignored `.env.production-migrate` file:

```bash
npm run db:status:prod
npm run db:migrate:prod
```

`db:status:prod` must be used to confirm the target and pending migrations before deployment. `db:migrate:prod` runs `prisma migrate deploy`; it does not create migrations. Never run `prisma migrate dev` against production, and never apply a production migration as an automatic consequence of local development or deployment. Follow the full [release procedure](docs/operational/RELEASE.md).

## Email

Resend delivers new-user password setup and password-reset messages. Configure `RESEND_API`, `SENDER_EMAIL`, and `HOSTNAME`; `HOSTNAME` must be an absolute origin for the current environment so generated reset links are valid. If the email variables are incomplete, the application skips delivery. Use a verified sender domain when testing real delivery.

## Vercel Blob

Recipe photos and book covers are stored in Vercel Blob. Link the intended Blob store to the local or deployed environment and provide `BLOB_READ_WRITE_TOKEN`. Uploads are validated and normalised before storage. Automated tests replace Blob operations with local fakes and must not call the live service.

## Automated checks

```bash
npm test
npm run test:integration
npm run test:routes
npm run test:migrations
npm run test:all
npm run typecheck
npm run lint
```

`npm test` runs lightweight tests without database access. The integration, route, and migration suites require a dedicated `TEST_DATABASE_URL`; they refuse a missing value, the normal `DATABASE_URL`, a production-like target, or a database name outside the `lifestyle_organiser_test_<identifier>` convention. Remote test hosts also require `ALLOW_REMOTE_TEST_DATABASE`. See [Automated Testing](docs/operational/TESTING.md) for isolation and cleanup details.

## Deployment

Vercel hosts the application and Neon hosts PostgreSQL. A merge or push to the configured production branch may trigger the Vercel code deployment, but production database migrations remain a separate deliberate action performed by the repository owner. Successful local checks do not authorise a commit, deployment, or production migration.

## Documentation

- Working rules and development process: [AGENTS.md](AGENTS.md), [Development Charter](docs/operational/DEVELOPMENT_CHARTER.md), and [Feature Workflow](docs/operational/FEATURE_WORKFLOW.md)
- Testing, backup, and release operations: [Automated Testing](docs/operational/TESTING.md), [Session Backup](docs/operational/SESSION_BACKUP.md), and [Release Procedure](docs/operational/RELEASE.md)
- Architecture and implementation rationale: [Decision Log](docs/project/DECISIONS.md)
- Database model: [Prisma schema](prisma/schema.prisma) and the checked-in migration history under `prisma/migrations/`
- Current and planned features: [Product Backlog](docs/project/BACKLOG.md)
- Visual direction: [Design](docs/project/DESIGN.md)
- Historical launch scope: [v1.0 Scope](docs/project/v1_scope.md) — retained as historical context, not the current complete product specification
