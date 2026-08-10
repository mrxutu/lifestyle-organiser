# Production Release Procedure

## Purpose

This document governs production code deployment and database migrations. Production release is always deliberate and human-controlled; successful local verification does not authorise it.

## 1. Confirm readiness

Before release, the repository owner confirms that:

- implementation and relevant documentation are complete;
- automated verification and required manual testing have passed;
- the complete working-tree diff is understood;
- generated files and migration SQL have been reviewed;
- only intended changes will be released.

The repository owner controls commits, merges and pushes.

## 2. Approve the application version

Once the exact release contents are known, determine one version increment using the highest applicable category: major for a significant product direction, compatibility, data-model or architecture change; minor for a new user-facing feature or meaningful product enhancement; or patch for a bug fix, small UI or technical improvement, or repository or documentation correction included in the release.

The repository owner approves the version. Update the root `package.json` version and the corresponding root package version fields in `package-lock.json` as part of the release-ready source before deployment, then run the normal release verification. Feature branches retain the current released version during normal development.

## 3. Approve the release sequence

Decide whether the release contains database migrations and approve the order of migration and code deployment based on compatibility. Prefer changes that keep old and new application versions compatible during deployment.

Do not assume that every release has a migration or that code must always deploy before the database changes. If safe ordering is unclear, stop and resolve it before touching production.

## 4. Prepare production migrations

Production commands read `DATABASE_URL` from the ignored `.env.production-migrate` file. Confirm the exact production target without printing credentials.

Before applying a migration:

- confirm an appropriate database backup or Neon restore point;
- review the expected migration SQL and data implications;
- check migration status and confirm the expected pending migrations:

```bash
npm run db:status:prod
```

Never use `prisma migrate dev`, `db push`, reset commands or development seeds against production.

## 5. Execute the approved release

The repository owner performs the approved code deployment and, when required, applies checked-in migrations with:

```bash
npm run db:migrate:prod
```

`db:migrate:prod` runs `prisma migrate deploy`; it applies existing migrations and does not create new ones.

After migration, run `npm run db:status:prod` again and confirm that the expected migrations succeeded. Do not continue past an unexpected migration or deployment result.

## 6. Smoke test

Verify at minimum:

- the application loads and authentication works;
- affected features behave correctly;
- existing data remains readable;
- representative create or update operations work where safe;
- relevant roles, permissions and household boundaries still hold;
- production logs show no unexpected errors.

Avoid leaving unnecessary test data in production.

## 7. Complete the release

After production verification, the repository owner performs any branch synchronization or cleanup appropriate to the repository’s configured branch model. Do not hardcode or assume a branch topology.

Record any release problem, rollback, hotfix or operational follow-up in the appropriate backlog or decision history.

## Failure and rollback

If a production problem appears:

1. Stop further release actions.
2. Assess user, code and data impact.
3. Choose a forward fix, code rollback or database recovery based on the migration’s compatibility and data effects.
4. Restore data only when necessary and from a verified recovery point.
5. Re-run focused smoke tests after remediation.

Never reverse or restore a production database without understanding the consequences for code compatibility and data written since release.
