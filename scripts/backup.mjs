import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, chmod, lstat, mkdir, mkdtemp, readdir, realpath, rename, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_NAME = 'lifestyle-organiser'
const RETENTION_COUNT = 10
const RSYNC_PATH = '/usr/bin/rsync'
const SNAPSHOT_PATTERN = /^lifestyle-organiser_\d{4}-\d{2}-\d{2}_\d{6}$/
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const exclusions = [
  '/node_modules/',
  '/.next/',
  '/out/',
  '/build/',
  '/coverage/',
  '/.turbo/',
  '/.cache/',
  '/app/generated/prisma/',
  '*.tsbuildinfo',
  'next-env.d.ts',
  '.DS_Store',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '.pnpm-debug.log*',
]

function timestamp(date = new Date()) {
  const part = (value) => String(value).padStart(2, '0')
  return [
    `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`,
    `${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`,
  ].join('_')
}

function expandHome(value) {
  if (value === '~') return os.homedir()
  if (value.startsWith(`~${path.sep}`)) return path.join(os.homedir(), value.slice(2))
  return value
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

async function resolveWithExistingAncestor(candidate) {
  const missingParts = []
  let current = candidate

  while (true) {
    try {
      const resolved = await realpath(current)
      return path.join(resolved, ...missingParts.reverse())
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
      const parent = path.dirname(current)
      if (parent === current) throw error
      missingParts.push(path.basename(current))
      current = parent
    }
  }
}

async function validateBackupRoot(configuredPath) {
  const lexicalPath = path.resolve(expandHome(configuredPath))
  const canonicalRepository = await realpath(repositoryRoot)
  const prospectiveCanonical = await resolveWithExistingAncestor(lexicalPath)

  if (isInside(canonicalRepository, prospectiveCanonical)) {
    throw new Error('Backup destination must be outside the repository')
  }

  await mkdir(lexicalPath, { recursive: true, mode: 0o700 })
  const canonicalBackupRoot = await realpath(lexicalPath)

  if (isInside(canonicalRepository, canonicalBackupRoot)) {
    throw new Error('Backup destination must be outside the repository')
  }

  const rootStats = await lstat(canonicalBackupRoot)
  if (!rootStats.isDirectory()) throw new Error('Backup destination is not a directory')

  return canonicalBackupRoot
}

function runRsync(source, destination) {
  const args = ['-a']
  for (const exclusion of exclusions) args.push(`--exclude=${exclusion}`)
  args.push(`${source}${path.sep}`, `${destination}${path.sep}`)

  return new Promise((resolve, reject) => {
    const child = spawn(RSYNC_PATH, args, { stdio: 'ignore' })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`rsync failed${signal ? ` after signal ${signal}` : ` with exit code ${code}`}`))
    })
  })
}

async function completedSnapshots(backupRoot) {
  const entries = await readdir(backupRoot, { withFileTypes: true })
  const snapshots = []

  for (const entry of entries) {
    if (!SNAPSHOT_PATTERN.test(entry.name) || !entry.isDirectory() || entry.isSymbolicLink()) continue
    const snapshotPath = path.join(backupRoot, entry.name)
    const stats = await lstat(snapshotPath)
    if (stats.isDirectory() && !stats.isSymbolicLink()) snapshots.push(snapshotPath)
  }

  return snapshots.sort((left, right) => path.basename(right).localeCompare(path.basename(left)))
}

async function applyRetention(backupRoot, currentSnapshot) {
  const snapshots = await completedSnapshots(backupRoot)
  const oldSnapshots = snapshots.slice(RETENTION_COUNT).filter((snapshot) => snapshot !== currentSnapshot)

  for (const snapshot of oldSnapshots) {
    await rm(snapshot, { recursive: true })
  }
}

async function main() {
  const configuredRoot = process.env.LIFESTYLE_ORGANISER_BACKUP_DIR?.trim()
    || path.join(os.homedir(), 'Library', 'Application Support', 'Lifestyle Organiser', 'Session Backups')
  const snapshotName = `${PROJECT_NAME}_${timestamp()}`
  const requestedSnapshot = path.join(path.resolve(expandHome(configuredRoot)), snapshotName)

  console.log('Session backup started.')
  console.log(`Destination: ${requestedSnapshot}`)

  const backupRoot = await validateBackupRoot(configuredRoot)
  const finalSnapshot = path.join(backupRoot, snapshotName)
  const incompletePrefix = path.join(backupRoot, `.${snapshotName}.incomplete-${process.pid}-`)

  await access(RSYNC_PATH, constants.X_OK)

  try {
    await lstat(finalSnapshot)
    throw new Error('A backup with the current timestamp already exists')
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  const incompleteSnapshot = await mkdtemp(incompletePrefix)
  await chmod(incompleteSnapshot, 0o700)

  try {
    await runRsync(repositoryRoot, incompleteSnapshot)
    await chmod(incompleteSnapshot, 0o700)
    await rename(incompleteSnapshot, finalSnapshot)
  } catch (error) {
    await rm(incompleteSnapshot, { recursive: true, force: true }).catch(() => {})
    throw error
  }

  await applyRetention(backupRoot, finalSnapshot)
  console.log('Session backup completed successfully.')
}

main().catch((error) => {
  console.error(`Session backup failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  process.exitCode = 1
})
