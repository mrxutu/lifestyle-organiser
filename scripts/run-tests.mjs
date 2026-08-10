import { readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const arguments_ = process.argv.slice(2)
const serial = arguments_.includes('--serial')
const database = arguments_.includes('--database')
const moduleMocks = arguments_.includes('--module-mocks')
const roots = arguments_.filter((argument) => (
  argument !== '--serial' && argument !== '--database' && argument !== '--module-mocks'
))

if (roots.length === 0) {
  console.error('Provide at least one test directory')
  process.exit(1)
}

function findTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return findTests(path)
    return entry.isFile() && entry.name.endsWith('.test.ts') ? [path] : []
  })
}

const files = roots.flatMap((root) => {
  const path = resolve(root)
  if (!statSync(path).isDirectory()) throw new Error(`Test root is not a directory: ${root}`)
  return findTests(path)
}).sort()

if (files.length === 0) {
  console.error(`No .test.ts files found below: ${roots.join(', ')}`)
  process.exit(1)
}

console.log(`Running ${files.length} test files:`)
for (const file of files) console.log(`- ${file}`)

const tsx = resolve('node_modules/.bin/tsx')
const options = ['--test']
if (serial) options.push('--test-concurrency=1')

function safeTestDatabaseEnvironment() {
  const value = process.env.TEST_DATABASE_URL?.trim()
  if (!value) throw new Error('TEST_DATABASE_URL is required for database-writing tests')

  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL')
  }

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('TEST_DATABASE_URL must use the postgresql: protocol')
  }

  const normalDatabase = process.env.DATABASE_URL?.trim()
  if (normalDatabase && value === normalDatabase) {
    throw new Error('TEST_DATABASE_URL must not equal DATABASE_URL')
  }

  const databaseName = decodeURIComponent(url.pathname.slice(1))
  if (!/^lifestyle_organiser_test_[a-z0-9_]+$/.test(databaseName)) {
    throw new Error(
      'Test database name must match lifestyle_organiser_test_<lowercase identifier>',
    )
  }

  const productionMarkers = ['prod', 'production', 'live']
  const targetDescription = `${url.hostname}/${databaseName}`.toLowerCase()
  if (productionMarkers.some((marker) => targetDescription.includes(marker))) {
    throw new Error('TEST_DATABASE_URL appears to target production')
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
  if (!localHosts.has(url.hostname) && process.env.ALLOW_REMOTE_TEST_DATABASE !== '1') {
    throw new Error(
      'Remote test databases require ALLOW_REMOTE_TEST_DATABASE=1 after confirming an approved development target',
    )
  }

  return { ...process.env, DATABASE_URL: value }
}

const environment = database ? safeTestDatabaseEnvironment() : { ...process.env }
const executable = moduleMocks ? process.execPath : tsx
const executableArguments = moduleMocks
  ? ['--experimental-test-module-mocks', '--import', 'tsx', ...options, ...files]
  : [...options, ...files]
const result = spawnSync(executable, executableArguments, { stdio: 'inherit', env: environment })
if (result.error) throw result.error
process.exit(result.status ?? 1)
