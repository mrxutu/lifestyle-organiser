# Local Session Backup

## Purpose

The session backup preserves the complete local project state that Git alone cannot recover. This includes dirty working-tree changes, untracked and ignored files, local environment configuration, and Git metadata.

It is a local filesystem safeguard. It does not back up PostgreSQL data, deployed configuration, cloud services, or unsaved editor buffers.

## Beginning-of-session procedure

Before making development changes:

1. Run `npm run backup` from the repository root.
2. Confirm that it reports successful completion.
3. Check the current Git branch and status.
4. Only then begin development work.

If the backup fails, stop and resolve the failure before changing the project.

## Storage and security

By default, completed backups are stored in:

```text
~/Library/Application Support/Lifestyle Organiser/Session Backups
```

Set `LIFESTYLE_ORGANISER_BACKUP_DIR` in the shell environment to use a different local directory. The destination must be outside the repository. Do not point it at cloud-synchronised, network, or removable storage unless the security implications have been explicitly assessed.

Snapshots contain the project's actual `.env*` files and therefore contain secrets. Treat the backup directory as sensitive data, keep macOS FileVault enabled, do not commit or upload snapshots, and do not share them without first removing secrets.

## Included state

Each completed snapshot includes:

- tracked, modified, staged, unstaged, and untracked files;
- hidden and ignored local files;
- all `.env*` files;
- `.git` metadata, including local branches, refs, index state, and reflogs;
- other local project state not explicitly excluded below.

Avoid running Git, package, build, or file-changing operations concurrently with the backup. The copy captures files from the live filesystem and is not a transactional snapshot.

## Exclusions

The following reproducible or generated paths are deliberately excluded:

```text
node_modules/
.next/
out/
build/
coverage/
.turbo/
.cache/
app/generated/prisma/
*.tsbuildinfo
next-env.d.ts
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
```

Dependencies can be restored from `package-lock.json`, build output can be regenerated, and Prisma output can be regenerated from the tracked schema and migrations.

## Completion and retention

A backup is first copied into a private `.incomplete-*` directory. It is renamed to `lifestyle-organiser_YYYY-MM-DD_HHMMSS` only after the copy succeeds.

The newest ten successfully completed project snapshots are retained. Retention runs only after a new backup completes and deletes only real directories whose names exactly match the project's completed-snapshot format. Failed backups do not remove valid older snapshots.

## Restoring safely

Do not restore over the active project directory.

1. Stop development servers and any process writing to the project.
2. Select a completed `lifestyle-organiser_YYYY-MM-DD_HHMMSS` snapshot.
3. Copy that snapshot to a separate temporary location.
4. Confirm that expected source files, `.git`, and required `.env*` filenames are present without printing secret contents.
5. Run `git status` in the temporary copy and inspect its state.
6. Preserve or move the damaged project directory aside.
7. Only after verification, move or copy the recovered project into the intended location.
8. Reinstall dependencies and regenerate excluded output as required.

Database contents and externally managed secrets must be recovered separately.
