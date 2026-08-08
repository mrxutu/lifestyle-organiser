# Feature Development Workflow

## Purpose

This document defines the standard workflow used for all significant development work.

Its purpose is to ensure:

- clear product decisions before implementation;
- minimal rework;
- controlled schema and architectural changes;
- consistent review;
- predictable releases.

This workflow applies to every project using the shared operational documentation.

---

# Roles

## Product Owner

Responsible for:

- defining product behaviour;
- approving architectural decisions;
- approving implementation;
- performing manual testing;
- deciding when changes are released.

---

## Sydney

Acts as:

- architect;
- technical reviewer;
- product reviewer;
- implementation critic.

Responsibilities include:

- refining feature ideas;
- identifying edge cases;
- reviewing George's plans;
- reviewing implementation;
- identifying architectural risks;
- maintaining operational documentation.

Sydney does not modify the repository.

---

## George

Acts as implementation engineer.

Responsibilities include:

- repository analysis;
- implementation planning;
- code changes;
- migrations;
- testing;
- verification.

George follows AGENTS.md and the Development Charter.

George never commits, pushes or deploys.

---

# Standard Feature Lifecycle

Every significant feature follows these stages.

---

# Phase 1 – Product Definition

Objective:

Define the desired behaviour before any technical work begins.

Typical activities:

- clarify requirements;
- identify user behaviour;
- define boundaries;
- identify dependencies;
- agree success criteria.

No repository analysis occurs during this phase.

Output:

Approved product definition.

---

# Phase 2 – Discovery

Repository analysis only.

George must:

- analyse the existing implementation;
- identify affected components;
- identify affected APIs;
- identify affected database objects;
- identify affected UI;
- identify migration implications;
- identify risks;
- identify blockers;
- propose an implementation plan.

George must NOT:

- modify files;
- create migrations;
- edit code;
- run migrations.

Output:

Implementation proposal.

The final line of every discovery report should be equivalent to:

> Awaiting approval before modifying any files.

---

# Phase 3 – Design Review

Sydney and the Product Owner review the proposal.

Objectives:

- confirm architecture;
- resolve product decisions;
- reduce unnecessary complexity;
- identify unintended consequences.

Possible outcomes:

- approved;
- approved with amendments;
- returned for further discovery.

---

# Phase 4 – Implementation

Only begins after explicit approval.

George may:

- modify files;
- create migrations;
- update documentation;
- regenerate generated files;
- execute approved development commands.

George should remain within the approved scope.

If implementation uncovers a significant architectural issue or product decision, implementation should pause and return to Discovery.

---

# Phase 5 – Verification

George performs technical verification.

Typical activities:

- Prisma validation;
- TypeScript;
- build;
- lint;
- automated tests;
- migration verification.

George produces:

- implementation summary;
- changed-file summary;
- generated-file summary;
- manual testing checklist.

---

# Phase 6 – Manual Testing

The Product Owner performs application testing.

Any defects are:

- corrected;
- re-tested;
- verified.

Repeat until accepted.

---

# Phase 7 – Release

Follow RELEASE.md.

Includes:

- production migration;
- deployment;
- smoke testing;
- branch merge;
- branch cleanup.

---

# Scope Control

Every implementation request must explicitly state one of the following.

## Discovery Only

George may analyse the repository only.

No files may be modified.

---

## Implementation

George may implement only the previously approved design.

Implementation should remain within the approved scope.

If unrelated issues are discovered they should be reported separately.

---

# Command Approval

George may read files and analyse the repository without approval.

Before executing commands that modify the development environment, George should request approval.

This includes, for example:

- Prisma migrations
- Database updates
- Generated client regeneration
- Package installation
- Build commands that may modify artefacts
- Any command with side effects

Read-only commands such as searches, status checks and schema inspection do not require approval.

---

# Out-of-Scope Work

George should clearly distinguish between:

- required work;
- optional improvements;
- unrelated technical debt.

Unrelated issues should not be implemented without approval.

---

# Decision Gates

The following always require explicit approval before implementation:

- schema changes;
- migrations;
- authentication;
- authorisation;
- permissions;
- architectural refactoring;
- destructive changes;
- data migration;
- deployment strategy changes.

---

# Working Principle

Think first.

Implement second.

Review third.

Release last.