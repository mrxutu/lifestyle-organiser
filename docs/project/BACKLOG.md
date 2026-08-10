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

## 17. To-do List - **Status:** Complete

Added a separately controlled, household-scoped To-do destination for tasks without a date or time requirement.

- To-dos have a title, optional description, Low/Normal/High priority, creation date, boolean completion state and one or more active household-member owners.
- The list defaults to the current member's incomplete To-dos, supports status/priority/owner filters and orders High, Normal then Low with newest first within each priority.
- Completion and reopening happen directly from the list; create/edit uses the responsive dialog/sheet convention.
- Profile includes only To-dos assigned to the current member.
- Household Statistics count To-dos and include their creation dates in Last activity; edits and completion changes do not contribute.
- Page and API section guards, household scoping and active-owner validation are enforced server-side.

To-dos deliberately have no due date, time, recurrence, notification, reminder scheduling or conversion relationship with Reminders.

---

## 18. Household Cascade Deletion - **Status:** Complete

Super Admins can deliberately delete an eligible household together with its users, content, assignments and household-owned lookup records. The operation uses a dedicated endpoint, exact case-sensitive household-name confirmation and an explicit serializable database transaction. The household and its users are locked and revalidated before any destructive work, all deletes are derived through target-household content, and the Household is removed last.

A household containing any active or inactive Super Admin is ineligible. The UI explains this and the transaction enforces it again. Existing ordinary deletion remains available for already-empty households.

Managed Recipe and Book image references are collected before the transaction deletes their records, filtered through the existing feature-owned Blob URL guards, deduplicated and cleaned only after database commit. Cleanup failure is reported as a non-fatal warning and never misrepresents the successful database deletion.

---

## 19. Keyboard Interaction Semantics - **Status:** Complete

Watchlist entries now expose an explicit native Edit button with an entry-specific accessible name instead of relying on a pointer-only card click handler. Admin user names are native, visibly focusable Edit buttons while the existing row click remains available as a pointer convenience without duplicate activation.

The audit confirmed that Admin household rows/cards, Recipe cards, Book cards, Reminder rows/cards, To-do cards and lookup-management rows already expose equivalent native controls and need no Item 19 changes.

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
