import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyMigration,
  applyMigrationsThrough,
  deployTrackedMigrations,
  migrationNames,
  withDisposableTestDatabase,
} from '../fixtures/migration-database'

test('the complete tracked migration chain builds a fresh disposable PostgreSQL database', async () => {
  await withDisposableTestDatabase('fresh', async ({ client, databaseUrl }) => {
    deployTrackedMigrations(databaseUrl)

    const applied = await client.query('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')
    assert.equal(applied.rowCount, (await migrationNames()).length)
    for (const table of ['Household', 'User', 'Event', 'Recipe', 'WatchlistEntry', 'Book', 'AuthRateLimit']) {
      const result = await client.query('SELECT to_regclass($1) AS table_name', [`public."${table}"`])
      assert.notEqual(result.rows[0]?.table_name, null)
    }

    const constraints = await client.query(`
      SELECT conname, confdeltype
      FROM pg_constraint
      WHERE conname IN (
        'EventAttendee_eventId_fkey',
        'Ingredient_recipeId_fkey',
        'WatchlistViewer_watchlistEntryId_fkey',
        'PasswordResetToken_userId_fkey',
        'Book_readerId_fkey'
      )
    `)
    const rules = new Map(constraints.rows.map((row) => [row.conname, row.confdeltype]))
    assert.equal(rules.get('EventAttendee_eventId_fkey'), 'c')
    assert.equal(rules.get('Ingredient_recipeId_fkey'), 'c')
    assert.equal(rules.get('WatchlistViewer_watchlistEntryId_fkey'), 'c')
    assert.equal(rules.get('PasswordResetToken_userId_fkey'), 'c')
    assert.equal(rules.get('Book_readerId_fkey'), 'r')
  })
})

test('assignment backfills and role evolution preserve existing data', async () => {
  await withDisposableTestDatabase('assignments', async ({ client }) => {
    await applyMigrationsThrough(client, '20260806091737_password_reset_token_cascade_delete')
    await client.query(`
      INSERT INTO "Household" (id, name) VALUES ('h1', 'Household');
      INSERT INTO "User" (id, email, name, role, "isActive", "householdId") VALUES
        ('author', 'author@example.test', 'Author', 'ADMIN', true, 'h1'),
        ('inactive', 'inactive@example.test', 'Inactive', 'MEMBER', false, 'h1');
      INSERT INTO "Recipe" (id, title, tags, "householdId", "authorId")
        VALUES ('recipe', 'Legacy recipe', ARRAY[]::TEXT[], 'h1', 'author');
      INSERT INTO "WatchlistSource" (id, name) VALUES ('source', 'Legacy source');
      INSERT INTO "WatchlistEntry" (id, name, "sourceId", "householdId", "updatedAt")
        VALUES ('entry', 'Legacy entry', 'source', 'h1', now());
    `)

    await applyMigration(client, '20260806150000_add_recipe_chefs_and_watchlist_viewers')
    await applyMigration(client, '20260807195712_add_super_admin_roles')
    await applyMigration(client, '20260807195800_migrate_existing_admins_to_super_admin')

    assert.equal((await client.query('SELECT "chefId" FROM "Recipe" WHERE id = $1', ['recipe'])).rows[0]?.chefId, 'author')
    assert.deepEqual(
      (await client.query('SELECT "userId" FROM "WatchlistViewer" WHERE "watchlistEntryId" = $1', ['entry'])).rows,
      [{ userId: 'author' }],
    )
    assert.equal((await client.query('SELECT role::text FROM "User" WHERE id = $1', ['author'])).rows[0]?.role, 'SUPER_ADMIN')
  })
})

test('household lookup migration duplicates shared lookups and rewires each household record', async () => {
  await withDisposableTestDatabase('lookups', async ({ client }) => {
    await applyMigrationsThrough(client, '20260807195800_migrate_existing_admins_to_super_admin')
    await client.query(`
      INSERT INTO "Household" (id, name) VALUES ('h1', 'One'), ('h2', 'Two');
      INSERT INTO "User" (id, email, "householdId") VALUES
        ('u1', 'one@example.test', 'h1'), ('u2', 'two@example.test', 'h2');
      INSERT INTO "EventType" (id, name, color) VALUES ('event_type', 'Shared type', '#3b82f6');
      INSERT INTO "WatchlistSource" (id, name) VALUES ('watch_source', 'Shared watch');
      INSERT INTO "BookSource" (id, name) VALUES ('book_source', 'Shared book');
      INSERT INTO "Event" (id, title, "startAt", "eventTypeId", "householdId", "creatorId") VALUES
        ('e1', 'One event', now(), 'event_type', 'h1', 'u1'),
        ('e2', 'Two event', now(), 'event_type', 'h2', 'u2');
      INSERT INTO "WatchlistEntry" (id, name, "sourceId", "householdId", "updatedAt") VALUES
        ('w1', 'One watch', 'watch_source', 'h1', now()),
        ('w2', 'Two watch', 'watch_source', 'h2', now());
      INSERT INTO "Book" (id, title, author, "sourceId", "readerId", "householdId") VALUES
        ('b1', 'One book', 'Author', 'book_source', 'u1', 'h1'),
        ('b2', 'Two book', 'Author', 'book_source', 'u2', 'h2');
    `)

    await applyMigration(client, '20260808120000_household_scoped_lookups')

    for (const table of ['EventType', 'WatchlistSource', 'BookSource']) {
      const rows = await client.query(`SELECT "householdId", name FROM "${table}" ORDER BY "householdId"`)
      assert.equal(rows.rowCount, 2)
      assert.deepEqual(rows.rows.map(({ householdId }) => householdId), ['h1', 'h2'])
    }
    for (const [table, lookupTable, foreignKey] of [
      ['Event', 'EventType', 'eventTypeId'],
      ['WatchlistEntry', 'WatchlistSource', 'sourceId'],
      ['Book', 'BookSource', 'sourceId'],
    ]) {
      const mismatches = await client.query(`
        SELECT COUNT(*)::int AS count FROM "${table}" content
        JOIN "${lookupTable}" lookup ON lookup.id = content."${foreignKey}"
        WHERE lookup."householdId" <> content."householdId"
      `)
      assert.equal(mismatches.rows[0]?.count, 0)
    }
  })
})

test('authentication hardening normalizes email, invalidates reset links, and creates protected storage', async () => {
  await withDisposableTestDatabase('auth', async ({ client }) => {
    await applyMigrationsThrough(client, '20260808120000_household_scoped_lookups')
    await client.query(`
      INSERT INTO "User" (id, email) VALUES ('user', ' Mixed.Case@Example.TEST ');
      INSERT INTO "PasswordResetToken" (id, token, "userId", "expiresAt")
        VALUES ('token', 'plaintext-secret', 'user', now() + interval '1 hour');
    `)

    await applyMigration(client, '20260808160000_authentication_hardening')

    const user = await client.query('SELECT email, "authVersion" FROM "User" WHERE id = $1', ['user'])
    assert.deepEqual(user.rows[0], { email: 'mixed.case@example.test', authVersion: 0 })
    assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM "PasswordResetToken"')).rows[0]?.count, 0)
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM information_schema.columns WHERE table_name = 'PasswordResetToken' AND column_name = 'tokenHash'`)).rows[0]?.count, 1)
    assert.notEqual((await client.query('SELECT to_regclass($1) AS table_name', ['public."AuthRateLimit"'])).rows[0]?.table_name, null)
  })
})

test('authentication hardening refuses case-insensitive duplicate production-style data', async () => {
  await withDisposableTestDatabase('auth_collision', async ({ client }) => {
    await applyMigrationsThrough(client, '20260808120000_household_scoped_lookups')
    await client.query(`
      INSERT INTO "User" (id, email) VALUES
        ('one', 'Collision@Example.test'),
        ('two', 'collision@example.test');
    `)
    await assert.rejects(
      applyMigration(client, '20260808160000_authentication_hardening'),
      /duplicate key value|unique constraint/i,
    )
  })
})
