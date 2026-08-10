import { spawnSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const MIGRATIONS_ROOT = path.resolve('prisma/migrations')

function validatedTestUrl() {
  const value = process.env.TEST_DATABASE_URL?.trim()
  if (!value) throw new Error('TEST_DATABASE_URL is required for migration tests')
  const url = new URL(value)
  const databaseName = decodeURIComponent(url.pathname.slice(1))
  if (!['postgresql:', 'postgres:'].includes(url.protocol)) throw new Error('TEST_DATABASE_URL must be PostgreSQL')
  if (!/^lifestyle_organiser_test_[a-z0-9_]+$/.test(databaseName)) throw new Error('Unsafe test database name')
  if (['prod', 'production', 'live'].some((marker) => `${url.hostname}/${databaseName}`.toLowerCase().includes(marker))) {
    throw new Error('Production-like migration target rejected')
  }
  return url
}

function quoteIdentifier(identifier: string) {
  if (!/^[a-z0-9_]+$/.test(identifier)) throw new Error('Unsafe PostgreSQL identifier')
  return `"${identifier}"`
}

export async function migrationNames() {
  const entries = await readdir(MIGRATIONS_ROOT, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
}

export async function withDisposableTestDatabase<T>(
  label: string,
  run: (context: { client: pg.Client; databaseUrl: string; databaseName: string }) => Promise<T>,
) {
  const adminUrl = validatedTestUrl()
  const databaseName = `lifestyle_organiser_test_${label}_${randomUUID().replaceAll('-', '').slice(0, 8)}`
  const targetUrl = new URL(adminUrl)
  targetUrl.pathname = `/${databaseName}`
  targetUrl.searchParams.delete('schema')
  const admin = new pg.Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)} TEMPLATE template0`)

  const client = new pg.Client({ connectionString: targetUrl.toString() })
  try {
    await client.connect()
    return await run({ client, databaseUrl: targetUrl.toString(), databaseName })
  } finally {
    await client.end().catch(() => {})
    await admin.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [databaseName],
    )
    await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`)
    await admin.end()
  }
}

export function deployTrackedMigrations(databaseUrl: string) {
  const result = spawnSync('./node_modules/.bin/prisma', ['migrate', 'deploy'], {
    cwd: path.resolve('.'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`Prisma migration deploy failed: ${result.stderr || result.stdout}`)
  }
}

export async function applyMigrationsThrough(client: pg.Client, finalMigration: string) {
  for (const migration of await migrationNames()) {
    const sql = await readFile(path.join(MIGRATIONS_ROOT, migration, 'migration.sql'), 'utf8')
    await client.query(sql)
    if (migration === finalMigration) return
  }
  throw new Error(`Migration not found: ${finalMigration}`)
}

export async function applyMigration(client: pg.Client, migration: string) {
  const sql = await readFile(path.join(MIGRATIONS_ROOT, migration, 'migration.sql'), 'utf8')
  await client.query(sql)
}
