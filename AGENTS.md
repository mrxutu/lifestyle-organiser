# Repository Agent Guidance

This file is the entry point for any AI coding agent working in this repository.

Unless explicitly instructed otherwise, assume every new feature request begins in Discovery mode.

Before beginning significant work, read and follow the documentation described below.

---

## 1. Operational documentation

Operational documentation defines **how development work must be performed**.

Mandatory:

- `docs/operational/DEVELOPMENT_CHARTER.md`

Read when relevant:

- `docs/operational/RELEASE.md`
- `docs/operational/TESTING.md`
- `docs/operational/WORKFLOW.md`
- `docs/operational/CODING_STANDARDS.md`
- Any other document within `docs/operational/` relevant to the requested task

The Development Charter takes precedence over ordinary implementation preferences.

Production, deployment, Git and database boundaries defined in the operational documentation must always be respected.

---

## 2. Project documentation

Project documentation defines **what this application is, how it works and why particular decisions were made**.

Before planning or implementing a significant change, review the relevant documents within:

- `docs/project/`

This may include:

- `docs/project/DECISIONS.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/DATABASE.md`
- `docs/project/FEATURES.md`
- `docs/project/ROADMAP.md`
- Any project-specific documentation relevant to the requested work

Do not assume that every listed document exists.

Read the documents that are present and relevant.

---

## 3. Required working method

Unless explicitly instructed otherwise, significant work follows this sequence:

1. Discovery and architecture
2. Plan review and approval
3. Implementation
4. Automated verification
5. Human testing and review
6. Human-controlled release

During discovery and planning:

- inspect the existing implementation;
- identify established project patterns;
- identify affected files and systems;
- identify database, security and compatibility implications;
- do not modify files unless explicitly authorised.

During implementation:

- follow the approved plan;
- minimise unrelated changes;
- preserve existing architecture where practical;
- stop and explain if new information materially changes the approved approach.

---

## 4. Repository and Git boundaries

Before modifying files:

- inspect Git status;
- identify pre-existing changes;
- avoid overwriting unrelated user work.

Unless explicitly instructed for a specific action, never:

- stage files;
- create or amend commits;
- push changes;
- merge or rebase branches;
- create pull requests;
- discard user changes;
- switch branches;
- trigger deployments.

The repository owner controls all commits, merges and releases.

---

## 5. Database boundaries

Normal development work must use only an approved non-production database.

Before running database commands:

- verify the active database target;
- do not assume that a local environment file necessarily points to a safe database;
- request local-network permission when required rather than concluding immediately that the database is unavailable.

Never access or modify production data unless explicitly authorised for that specific action.

Any destructive or potentially data-losing change must be explained and approved before execution.

Production migrations remain human-controlled and must follow `docs/operational/RELEASE.md`.

---

## 6. Scope discipline

Treat the approved task scope as a contractual boundary.

Do not fix unrelated issues merely because they are encountered during verification.

Pre-existing lint, build, test or type-check failures must be:

- reported separately;
- clearly identified as pre-existing;
- left unchanged unless explicit approval is given.

Related integrity corrections may be proposed, but must be identified separately and approved before being retained.

---

## 7. Verification and handover

Before requesting review:

- inspect the complete working-tree diff;
- account for every changed, added and deleted file;
- distinguish generated files from hand-authored files;
- identify any pre-existing user-owned changes;
- identify anything outside the approved scope.

Report:

- files changed, grouped by purpose;
- database and migration changes;
- checks run and their results;
- pre-existing failures;
- known limitations;
- recommended manual testing.

Do not present only a selected subset of files as though it represents the full change set.

---

## 8. Documentation precedence

Where instructions conflict, use this order:

1. Explicit instruction from the repository owner for the current task
2. `docs/operational/DEVELOPMENT_CHARTER.md`
3. Other documents in `docs/operational/`
4. Relevant documents in `docs/project/`
5. Existing repository conventions
6. General engineering preference

If a conflict materially affects security, data integrity, architecture or production safety, stop and explain it before proceeding.

---

## 9. General principle

Behave as an experienced software engineer working alongside the repository owner.

Exercise technical judgement, but keep all production, release and source-control authority under human control.
