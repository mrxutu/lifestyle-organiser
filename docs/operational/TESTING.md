# Automated Testing

## Test categories

The repository separates tests by execution cost and environment requirements:

- `tests/unit/` contains lightweight tests with no database or external-service access.
- `tests/integration/` contains PostgreSQL-backed helper and authentication integration tests.
- `tests/routes/` contains representative real route-handler tests with controlled authentication modules.
- `tests/migrations/` verifies fresh migration deployment and targeted data upgrades in disposable PostgreSQL databases.
- `tests/fixtures/` contains shared database lifecycle and cleanup helpers and is not a test-discovery root.

Test discovery is recursive. Every `.test.ts` file below the selected category is printed before execution, and a category fails if no tests are found.

## Commands

```bash
npm test                  # lightweight/unit tests only
npm run test:integration # PostgreSQL-backed helper/authentication integration
npm run test:routes      # PostgreSQL-backed real route handlers
npm run test:migrations  # disposable-database migration regressions
npm run test:all         # all categories in sequence
npm run typecheck        # standalone TypeScript verification
```

Database commands deliberately do not run during `npm test`.

## Test database safety

Database-writing categories require an explicit `TEST_DATABASE_URL`. They refuse to run when it is missing, equal to the normal `DATABASE_URL`, outside the approved `lifestyle_organiser_test_<identifier>` naming convention, or production-like. Remote test hosts additionally require an explicit `ALLOW_REMOTE_TEST_DATABASE=1` acknowledgement.

The test runner passes the validated `TEST_DATABASE_URL` to application code as `DATABASE_URL`; it never falls back to the normal application database.

Migration tests create uniquely named `lifestyle_organiser_test_*` disposable databases through the approved test connection and drop only those exact databases during cleanup. They run serially.

## Isolation and cleanup

Database fixtures use UUID-prefixed records so concurrent or interrupted runs are identifiable. Tests register cleanup in dependency-safe reverse order and use `finally` blocks. Stateful database categories run one test file at a time to avoid shared rate-limit, migration, or fixture state races.

An interrupted process may prevent cleanup. Before reusing a test database after an interruption, inspect only the approved test target for records prefixed `automated-test-` and disposable databases prefixed `lifestyle_organiser_test_`.

## External services

Automated tests must not call Resend or Vercel Blob. Authentication tests disable delivery configuration or exercise pre-delivery logic, and image tests use local fakes. Real email delivery, deployed Blob credentials, browser behavior, and production smoke testing remain manual checks.

## Coverage philosophy

Tests should protect important security, authorization, data-integrity, migration, and filter behavior. Do not add tests solely to increase a coverage percentage, and do not duplicate every trivial route permutation when representative route coverage plus focused helper coverage protects the same rule.
