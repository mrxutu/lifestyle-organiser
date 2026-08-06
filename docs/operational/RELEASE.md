# Release Procedure

**Version:** 1.0  
**Status:** Active

---

# Purpose

This document defines the standard release procedure for all projects.

Its purpose is to ensure that every production deployment follows the same repeatable process, reducing the risk of human error and ensuring that code, database changes and deployments remain synchronised.

Production release is always a human-controlled activity.

George must never perform any release action without explicit instruction.

---

# Release Principles

Every release should satisfy the following principles:

- Production changes are deliberate.
- Database changes are reversible where practical.
- Code reaches production only after successful local verification.
- Production deployments should contain no unexpected changes.
- Every release should leave the repository in a known-good state.

---

# Phase 1 – Development Complete

Before considering a release:

- Requested functionality has been implemented.
- Manual testing has completed successfully.
- Relevant automated checks have passed.
- The user has approved the implementation.
- The working tree has been reviewed.

Nothing should be committed until these conditions are satisfied.

---

# Phase 2 – Prepare Release

Confirm:

- Git working tree is understood.
- Only intended files have changed.
- Generated files have been reviewed where appropriate.
- Database migrations have been reviewed.
- Documentation has been updated where required.

Review:

- modified files
- migration SQL
- generated output
- documentation changes

---

# Phase 3 – Commit

The user alone performs Git commits.

George must never:

- create commits;
- amend commits;
- push commits.

Commit messages should accurately describe the completed feature.

---

# Phase 4 – Deploy Code

Merge the approved feature branch into the production branch.

Pushing to the production branch may automatically deploy to Vercel.

George should never trigger deployment automatically.

---

# Phase 5 – Database Migration

Production database migrations are performed only after:

- code review;
- successful testing;
- deployment approval.

Use:

```bash
npx prisma migrate deploy
```

Never use:

```bash
prisma migrate dev
```

against production.

Before migrating:

- confirm production backup or Neon restore point;
- confirm pending migrations; - 'npm run db:status:prod'
- confirm expected migration name.

Migrate

- Migrate changes - 'npm run db:migrate:prod'

After migrating:

- confirm migration success;
- verify migration status;
- perform smoke testing.

---

# Phase 6 – Production Smoke Test

Verify:

- application loads;
- authentication works;
- affected feature behaves correctly;
- existing data displays correctly;
- new data can be created;
- production logs show no unexpected errors.

Where practical:

- create one representative record;
- edit one representative record;
- verify filters;
- verify permissions.

---

# Phase 7 – Branch Cleanup

Once production has been verified:

1. Merge feature branch into `main`.
2. Delete the remote feature branch.
3. Switch the local repository back to `main`.
4. Pull the latest `main`.
5. Delete the local feature branch. 'git branch -d branch-name'
6. Confirm:

   - current branch is `main`;
   - working tree is clean;
   - local repository matches GitHub.

---

# Phase 8 – Retrospective

After every completed release ask:

- What worked well?
- What could be improved?
- Should the Development Charter change?
- Should Testing change?
- Should Release procedures change?
- Was unexpected technical debt introduced?
- Was documentation sufficient?

The operational documents should improve continuously.

---

# Emergency Rollback

If production problems are discovered:

1. Stop further releases.
2. Assess impact.
3. Determine whether rollback or hotfix is appropriate.
4. Restore the database only if necessary.
5. Deploy the corrected version.
6. Document the cause.

Never perform an emergency rollback without understanding the database implications.

---

# Definition of Complete

A release is complete only when:

- production deployment has succeeded;
- production database migration has completed;
- smoke testing has passed;
- repository cleanup has completed;
- retrospective has been considered.

A successful Git push alone does not constitute a successful release.