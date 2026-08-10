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
