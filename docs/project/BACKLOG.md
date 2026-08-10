# Lifestyle Organiser – Product Backlog

**Status:** Active

This backlog contains all approved future enhancements and technical improvements for Lifestyle Organiser.

Items are prioritised by product value rather than implementation effort.

---

# Priority 1 – Product Improvements

## 1. Household Administration - **Status:** Complete

Introduce three user roles.

### Super Admin

- Full system administration.
- Create and delete households.
- Administer all users.
- Manage global application settings.
- Assign or revoke Admin privileges.

### Admin

Restricted to their own household.

Can:

- Manage household members.
- Invite users.
- Activate and deactivate members.
- Remove members.
- Manage household lookup data.

Cannot:

- Create or delete households.
- Manage users outside their own household.
- Grant Super Admin privileges.

### Member

Current member behaviour.

No administrative permissions.

---

## 2. Household Default Data - **Status:** Complete

When a new household is created, automatically create a default set of lookup records.

Initially:

- Event Types
- Watchlist Sources
- Book Sources

The objective is that a newly created household can immediately begin using every feature without additional configuration.

When a household is deleted, the associated lookup data should also be removed.

The default data should be defined in a single reusable location.

---

## 3. Household Lookup Ownership - **Status:** Complete

Convert lookup tables from globally shared records to household-owned records.

Applies to:

- Event Types
- Watchlist Sources
- Book Sources

Each household should be able to:

- create;
- rename;
- delete;
- customise;

its own lookup values independently.

---

# Priority 2 – Security & Authorisation

## 4. API Section Security - **Status:** Complete

Section permissions must be enforced consistently.

Disabling a section should prevent:

- page access;
- API access;
- create;
- update;
- delete operations.

Security must never rely solely on navigation restrictions.

---

## 5. Image Upload Security - **Status:** Complete

Improve upload validation.

- Validate actual image contents.
- Do not rely solely on MIME type.
- Remove orphaned Blob files when records are deleted or images replaced.

---

## 6. Authentication Hardening - **Status:** Complete

Review and improve:

- login rate limiting;
- forgot-password rate limiting;
- password reset rate limiting;
- password strength policy;
- password reset session invalidation;
- password reset token storage.

---

# Priority 3 – Quality & Testing

## 7. Automated Testing - **Status:** Complete

Introduce automated tests.

Initial focus:

- cross-household security;
- API authorisation;
- assignment validation;
- deletion safeguards;
- password reset;
- migration regression;
- filter behaviour.

---

## 8. Resolve Existing Lint Issue - **Status:** Complete

Resolve the existing Theme Toggle lint warning as an isolated task.

---

# Priority 4 – Documentation

## 9. Replace Starter README - **Status:** Complete

Create project documentation covering:

- installation;
- environment variables;
- local development;
- database;
- migrations;
- email configuration;
- blob storage;
- deployment;
- testing.

---

## 10. Maintain Project Documentation - **Status:** Complete

Keep project documentation aligned with implementation while maintaining a small set of clear sources of truth.

Review after significant features.

Includes:

- AGENTS.md
- README.md
- operational procedures
- OVERVIEW.md
- BACKLOG.md
- DECISIONS.md
- DESIGN.md
- historical v1 scope

---

# Priority 5 – Operational Improvements

## 11. Remove Development Endpoints - **Status:** Complete

Reviewed development-only and operational routes.

- Removed the obsolete `/api/test-db` database diagnostic endpoint.
- Reviewed `/api/health` and intentionally retained it as a public, database-free operational liveness endpoint.

No other unintended diagnostic endpoints were identified.

---

## 12. Review Generated Prisma Strategy - **Status:** Complete

Reviewed the generated Prisma output and repository strategy.

- Retained `generated/prisma/` as committed, reproducible generated output because the current install, build and test commands do not generate it automatically.
- Retained the existing generator output path and application imports.
- Reconsider this strategy if a reliable generation stage is added to the build or deployment pipeline.

---

## 13. Application Version Number

Add a visible application/deployment version number.

Discovery should determine:

- the authoritative source of the version;
- how and when it changes;
- where it should be displayed;
- how to avoid hard-coded version values scattered through components.

---

## 14. Mobile Icon Sizing

Review icon sizing on mobile and increase icons where appropriate for usability and touch presentation.

Prefer shared styling or components where possible rather than individual one-off changes. Desktop presentation should not be enlarged unnecessarily.

---

## 15. Household Statistics

Enhance the Super Admin household view with useful household statistics, including:

- counts of household users and content;
- date of the most recent household entry or activity.

Discovery must first establish exactly which entities constitute an entry or count and how the latest activity date should be calculated. Avoid expensive or unnecessarily repetitive queries.

---

## 16. Consistent Page Layouts

Review application pages for duplicated or inconsistent page structure and introduce shared layout components or templates where they provide genuine consistency.

Discovery should identify the existing patterns and determine the appropriate abstraction before implementation. Avoid creating abstraction merely for its own sake.

---

## 17. To-do List

Add household to-do functionality.

This requires product design before implementation. Define at minimum:

- task ownership and assignment;
- due dates;
- completion behaviour;
- recurrence, if appropriate;
- filtering and display;
- household scoping;
- relationship with the existing Reminders functionality.

Do not assume the final data model or UI until this has been discussed and approved.

---

## 18. Household Cascade Deletion

Allow a Super Admin to deliberately delete an entire household together with its associated users, content, assignments and household-owned options.

This is a destructive operation and requires detailed discovery before implementation. Requirements should include:

- inventory every database relationship affected by household deletion;
- perform deletion safely and transactionally;
- ensure no records belonging to other households can be affected;
- require explicit confirmation, such as entering the household name;
- provide a clear indication of what will be permanently deleted;
- consider using the Household Statistics introduced by Item 15 to show deletion impact;
- retain server-side authorization and safeguards regardless of UI confirmation.

Item 18 remains sequenced after Item 15 so the household statistics work can inform the deletion experience.

These entries are candidate work definitions. Their inclusion in the backlog does not pre-approve their implementation or final technical design. Each remains subject to the normal discovery and approval workflow.

---

# Completed Features

- ✓ Recipe Chef assignment
- ✓ Watchlist Viewer assignment
- ✓ Member-based filtering
- ✓ Profile based on assigned member roles
- ✓ Recipe and Watchlist assignment filtering
- ✓ User deletion safeguards
- ✓ Household deletion safeguard for Books
- ✓ Development Charter
- ✓ Release Procedure
- ✓ AGENTS.md repository guidance

---

# Future Ideas

The following are intentionally excluded from the active backlog until product requirements become clearer.

Examples:

- shopping lists;
- meal planning;
- budgeting;
- recurring household tasks;
- notifications;
- shared file storage;
- additional media integrations.
