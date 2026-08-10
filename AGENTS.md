# Repository Agent Guidance

This file is the binding entry point for Codex and any other AI coding agent working in this repository. Explicit instructions from the repository owner for the current task take precedence.

Unless explicitly authorised to implement, treat significant feature and architecture requests as discovery work: inspect the repository, report findings and propose a plan without modifying files.

## Documentation routing

Read only the documents relevant to the task, but always respect the operational boundaries in this file.

- Developer setup and commands: `README.md`
- Feature lifecycle and approval gates: `docs/operational/FEATURE_WORKFLOW.md`
- Automated testing: `docs/operational/TESTING.md`
- Local backup and recovery: `docs/operational/SESSION_BACKUP.md`
- Production release and migrations: `docs/operational/RELEASE.md`
- Current product and architecture: `docs/project/OVERVIEW.md`
- Current UI conventions: `docs/project/DESIGN.md`
- Historical decisions: `docs/project/DECISIONS.md`
- Active and future work: `docs/project/BACKLOG.md`
- Frozen v1 baseline: `docs/project/v1_scope.md`
- Current database model and history: `prisma/schema.prisma` and `prisma/migrations/`

Current code, configuration, schema, migrations and package scripts take precedence over descriptive documentation when establishing executable behaviour. Report material drift rather than silently following stale prose.

## Before changing files

1. Run `npm run backup` from the repository root and confirm success.
2. Check the current Git branch and complete working-tree status.
3. Identify pre-existing changes and preserve user-owned work.
4. Confirm the approved scope and any database, security, compatibility or release implications.

If the backup fails, stop and resolve the failure before changing the project.

## Engineering principles

- Prefer correctness, maintainability and safe deployment over speed.
- Extend established patterns before introducing new abstractions.
- Keep changes as small and direct as practical.
- Do not refactor or fix unrelated code without approval.
- Do not add dependencies without clear need; explain maintenance, performance and realistic alternatives.
- Pause for approval if new information materially changes the agreed plan.
- Keep setup, operational and product documentation aligned when behaviour changes.

Authentication, authorisation, ownership and household isolation are separate concerns. Enforce security on the server; never rely on hidden navigation or client-side validation as the only control.

## Scope and source-control boundaries

Treat the approved scope as a contractual boundary. Report unrelated issues separately and leave them unchanged unless the owner expands the scope.

Unless explicitly instructed for a specific action, never:

- stage files, create or amend commits, or push;
- merge, rebase, switch branches or create pull requests;
- discard user changes;
- trigger deployments;
- modify production branches, settings, credentials or environment variables.

The repository owner controls all commits, merges and releases.

## Database and production boundaries

Normal development uses only an approved local PostgreSQL database or approved Neon development branch. Before any database command, verify the target; an environment filename alone is not proof that it is safe.

If an approved development database is blocked by sandbox or local-network restrictions, request the required permission rather than treating the database as unavailable or substituting another target.

- Use descriptive Prisma migrations rather than schema-synchronisation shortcuts.
- Never run destructive resets without explicit approval.
- Before a potentially data-losing change, explain affected data, preservation options, alternatives, backup needs and rollback implications.
- Never access or modify production data without explicit authority for that exact action.
- Production migrations are human-controlled and must follow `docs/operational/RELEASE.md`.

## Implementation and verification

Follow the approved plan and established architecture. Apply relevant checks in proportion to risk, which may include lint, typecheck, build, Prisma validation, unit tests, database-backed tests, route tests, migration tests and manual browser verification.

Resolve failures introduced by the work. Identify pre-existing failures separately and do not repair them without approval.

Before handoff:

- inspect the complete working-tree diff;
- account for every modified, added and deleted file;
- distinguish generated output from hand-authored changes;
- identify pre-existing user-owned changes and anything outside scope;
- report database changes, checks run, failures, limitations and recommended manual testing.

Successful automated checks do not authorise a commit, deployment or production change.

## Precedence

When guidance conflicts, use this order:

1. Explicit owner instruction for the current task
2. This file
3. Other documents in `docs/operational/`
4. Current project documentation in `docs/project/`
5. Historical project records
6. Existing repository conventions
7. General engineering preference

If a conflict affects security, data integrity, architecture or production safety, stop and explain it before proceeding.
