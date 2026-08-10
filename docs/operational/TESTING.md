# Automated Testing

## Test suites

- `tests/unit/` contains lightweight tests with no database or external-service access.
- `tests/integration/` covers PostgreSQL-backed authentication, household isolation, assignments and deletion safeguards.
- `tests/routes/` exercises representative real route handlers with controlled authentication modules.
- `tests/migrations/` verifies fresh migration deployment and targeted data upgrades in disposable PostgreSQL databases.
- `tests/fixtures/` contains shared lifecycle and cleanup helpers; it is not a test-discovery root.

Discovery is recursive. Each selected `.test.ts` file is printed before execution, and a suite fails if no tests are found.

## Test commands

```bash
npm test                  # unit tests only
npm run test:integration # PostgreSQL-backed integration tests
npm run test:routes      # PostgreSQL-backed route-handler tests
npm run test:migrations  # disposable-database migration regressions
npm run test:all         # the four test suites above, in sequence
```

`npm run test:all` does not run static analysis or a production build. A fuller verification pass may also include:

```bash
npm run lint
npm run typecheck
npm run build
```

Choose checks in proportion to the change. Database commands deliberately do not run during `npm test`.

## Test database safety

Every database-writing suite requires an explicit `TEST_DATABASE_URL`. The runner refuses a value that is missing, equals the normal `DATABASE_URL`, is not PostgreSQL, has a database name outside `lifestyle_organiser_test_<identifier>`, or appears production-like. A remote test host additionally requires `ALLOW_REMOTE_TEST_DATABASE=1` after the target has been approved.

The runner passes the validated test URL to application code as `DATABASE_URL`; it never falls back to the normal application database.

Migration tests create uniquely named `lifestyle_organiser_test_*` disposable databases through the approved test connection and drop only those exact databases. Stateful database suites run one test file at a time.

## Isolation and cleanup

Fixtures use UUID-prefixed records, register cleanup in dependency-safe reverse order and use `finally` blocks. An interrupted process may prevent cleanup. Before reusing a test database after interruption, inspect only the approved test target for records prefixed `automated-test-` and disposable databases prefixed `lifestyle_organiser_test_`.

## External services

Automated tests must not call Resend or Vercel Blob. Authentication tests disable delivery configuration or test pre-delivery logic, and image tests use local fakes. Real email delivery, deployed Blob credentials, browser behaviour and production smoke testing remain manual checks.

Tests should protect important security, authorisation, data-integrity, migration and filtering behaviour. Do not add tests solely to increase a coverage percentage or duplicate permutations already protected by representative route and helper coverage.
