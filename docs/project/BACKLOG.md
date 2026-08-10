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

## 13. Application Version Number - **Status:** Complete

Added a visible application version to the authenticated Profile page.

- The root `package.json` version is the single authoritative source.
- `1.0.0` is the first intentionally managed application version.
- The version is incremented once per explicitly approved production release according to the release procedure.
- A shared server-only accessor keeps the value out of individual components.

---

## 14. Mobile Icon Sizing - **Status:** Complete

Improved mobile and tablet navigation sizing and touch reliability.

- Primary household destinations use shared 44×44px targets and 20×20px icons below `lg`, while labelled desktop navigation retains its compact sizing.
- Admin and Theme controls moved into the Profile dropdown, leaving primary navigation capacity for the future To-do destination.
- The destination region supports up to six primary items, with isolated horizontal overflow at very narrow widths; a seventh destination requires a separate navigation-design review.

---

## 15. Household Statistics - **Status:** Complete

The Super Admin household view shows:

- member, Event, Recipe, Watchlist item and Book counts;
- the latest `createdAt` date across Events, Recipes, Watchlist entries and Books.

Reminder-style records count as Events because Reminders share the Event model. Members and administrative or configuration records never contribute to Last activity, and editing existing content is not new activity. Server-side grouped aggregations avoid per-household queries and allow the future To-do model to be added as another content type.

---

## 16. Consistent Page Layouts - **Status:** Complete

Authenticated pages use a lightweight shared `Page` wrapper for their established vertical rhythm and the existing `PageHeader` supports optional introductory content. Calendar and Watchlist now have correct page-level headings, Watchlist page controls are separated from its embedded Profile content, and legitimate detail, Admin and Profile layouts remain feature-specific.

The convention is documented for future feature work, including the To-do page. Initial empty states remain substantial, filtered-empty states remain concise, and Calendar retains its usable empty calendar with a lightweight inline message.

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

---

## 19. Keyboard Interaction Semantics

Review clickable cards and table rows that rely on pointer click handlers, including Watchlist entries and Admin management rows.

Ensure primary interactions are exposed through native interactive elements or equivalent keyboard-operable semantics, with visible focus and no duplicate or conflicting activation behaviour. Preserve the current visual presentation and responsive layouts.

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
