# Feature Development Workflow

## Purpose

This document defines the review gates for significant product and engineering work. Binding agent, source-control, database and production boundaries live in `AGENTS.md`.

Small, explicitly authorised maintenance tasks may use a proportionate version of this workflow, but they still require understood scope and verification.

## 1. Product definition

The repository owner defines the desired outcome, boundaries and success criteria. Product choices that materially affect the solution should be resolved before implementation.

## 2. Discovery

Discovery is repository analysis only unless implementation has already been explicitly authorised. The implementation agent should:

- inspect relevant code, configuration, schema and documentation;
- identify established patterns and affected systems;
- assess database, security, compatibility and migration implications;
- identify risks, blockers and testing needs;
- propose a concrete implementation plan.

No approval is implied by presenting a plan.

## 3. Approval

The repository owner reviews, amends or approves the proposal. Schema changes, migrations, authentication or authorisation changes, destructive operations, architectural refactors and production actions always require explicit approval.

## 4. Implementation

Implement only the approved scope. Preserve existing architecture where practical and minimise unrelated changes.

If implementation exposes a material new product decision, security concern, data risk or architectural change, pause and return to the approval gate.

## 5. Verification

Run checks appropriate to the change. Use `docs/operational/TESTING.md` for the automated-test suites and their database safeguards.

Investigate failures and distinguish regressions introduced by the work from pre-existing failures. Do not fix unrelated failures without approval.

## 6. Handoff and human review

Provide:

- a complete changed-file summary;
- important implementation decisions;
- database and migration details;
- checks run and their results;
- known limitations and regression risks;
- recommended manual testing.

The repository owner performs final review and decides whether the work is accepted. Release is a separate human-controlled process governed by `docs/operational/RELEASE.md`.
