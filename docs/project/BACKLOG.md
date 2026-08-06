# Lifestyle Organiser – Product Backlog

**Status:** Active

This backlog contains all approved future enhancements and technical improvements for Lifestyle Organiser.

Items are prioritised by product value rather than implementation effort.

---

# Priority 1 – Product Improvements

## 1. Household Administration

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

## 2. Household Default Data

When a new household is created, automatically create a default set of lookup records.

Initially:

- Event Types
- Watchlist Sources
- Book Sources

The objective is that a newly created household can immediately begin using every feature without additional configuration.

When a household is deleted, the associated lookup data should also be removed.

The default data should be defined in a single reusable location.

---

## 3. Household Lookup Ownership

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

## 4. API Section Security

Section permissions must be enforced consistently.

Disabling a section should prevent:

- page access;
- API access;
- create;
- update;
- delete operations.

Security must never rely solely on navigation restrictions.

---

## 5. Image Upload Security

Improve upload validation.

- Validate actual image contents.
- Do not rely solely on MIME type.
- Remove orphaned Blob files when records are deleted or images replaced.

---

## 6. Authentication Hardening

Review and improve:

- login rate limiting;
- forgot-password rate limiting;
- password reset rate limiting;
- password strength policy;
- password reset session invalidation;
- password reset token storage.

---

# Priority 3 – Quality & Testing

## 7. Automated Testing

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

## 8. Resolve Existing Lint Issue

Resolve the existing Theme Toggle lint warning as an isolated task.

---

# Priority 4 – Documentation

## 9. Replace Starter README

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

## 10. Maintain Project Documentation

Keep project documentation aligned with implementation.

Review after significant features.

Includes:

- DECISIONS.md
- ARCHITECTURE.md
- DATABASE.md
- FEATURES.md

---

# Priority 5 – Operational Improvements

## 11. Remove Development Endpoints

Review development-only routes.

Initially:

- `/api/test-db`

Ensure no unnecessary diagnostic endpoints remain in production.

---

## 12. Review Generated Prisma Strategy

Periodically review generated Prisma output and repository strategy after Prisma upgrades.

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