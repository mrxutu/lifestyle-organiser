# DECISIONS.md

A running, dated log of specific decisions made during the build that aren't captured elsewhere. Check here before re-deciding something. Add a short dated entry whenever a non-obvious call is made.

---

**2026-07 — Design direction**
Clean/minimal style confirmed. shadcn/ui chosen as the component library over hand-rolling.

**2026-07 — Event type colours**
Colour-coding for event types uses a constrained set of muted swatches (matching DESIGN.md's palette), not an open/free colour picker — keeps the calendar visually consistent as more event types get added.

**2026-07 — Calendar popups on mobile**
CRUD popups (add/edit event, add/edit event type) use shadcn Dialog on tablet/laptop, but should switch to a full-screen sheet/drawer on mobile rather than a cramped modal.

**2026-07 — Event attendees deferred**
`EventAttendee` (assigning an event specifically to Paul, Nick, or both) exists in the schema but is deliberately left out of the first Calendar build pass — follow-up, not v1.0-blocking.

**2026-07 — v1.0 "functional first" approach**
Priority is a working end-to-end version across all three features before revisiting styling/layout polish. Polish pass planned as v1.1, distinct from the "out of scope" feature list in `v1_scope.md` (which covers things not being built at all yet, e.g. meal planning) — v1.1 covers things that ARE built but rough.

**2026-07 — Reminders merged into Events**
Reminders are not a separate data model — a reminder is an Event with `recurrence` and `leadTimeDays` set. Removed the standalone `Reminder`/`ReminderRecipient` models from the schema. The Reminders page is a read-only, date-sorted (ascending `startAt`) view of Events, with this exact visibility rule:
- `leadTimeDays` is `null` → never shown on Reminders
- `leadTimeDays` is `0` → shown from creation until `startAt` passes into the past (always visible while upcoming)
- `leadTimeDays` is `N` (N > 0) → shown only once `daysUntil(startAt) < N` (inside the window); not shown before that
- Past events (`startAt < now()`) are never shown, regardless of `leadTimeDays`

`leadTimeDays` defaults to `0` on the event form (UI-level default, not a DB default — schema field stays nullable) — opt-out design: new events are visible on Reminders immediately unless the field is cleared to null. No separate "add reminder" form; reminders are created/edited via the normal event form.

`remindMinutesBefore` exists in the schema but is NOT exposed on the event form in v1.0 — it's unused (no notification system yet) and was causing confusing duplication with the "Show on Reminders" (`leadTimeDays`) field. Reserved for a possible future notifications feature.

Reminders page displays the event's time alongside the date when the event is not all-day.

**2026-07 — Recipe ingredients: fixed unit list, decimal amounts**
`Ingredient.unit` is a constrained enum (`MeasurementUnit`: TSP, TBSP, G, ML, LITRE, PINT, OZ, LB), nullable — null means no unit (e.g. "1 lemon" rather than forcing a unit). `Ingredient.amount` is `Float` (not Prisma `Decimal`) — supports fractional amounts like 1.5 without the added complexity of the Decimal type in application code.

**2026-07 — Recipe add/edit is a full page, not a popup**
Unlike Calendar/Reminders (which use dialogs), Recipes has a dedicated `/recipes/new` and `/recipes/[id]/edit` page — too much content (image upload, repeatable ingredient rows, repeatable step rows) for a popup to work well.

**2026-07 — Recipe image is optional**
`imageUrl` is nullable in the schema and must stay optional in the form and Zod validation — a recipe can be saved without a photo. The recipe list/card view needs a sensible placeholder for recipes with no image, not a broken image icon or forced blank space.

**2026-07 — Recipe routing and method field**
Three distinct routes: `/recipes` (list/browse, cards), `/recipes/[id]` (read-only view — click a card to open), `/recipes/[id]/edit` (edit form — via an Edit button on the card or view page), `/recipes/new` (create). The `Step` model was removed — method/instructions is a single multi-line text field (`Recipe.method`) so a full set of instructions can be pasted in at once, rather than adding one step row at a time. The display should detect numbered lines (e.g. lines starting "1.", "2.") and render them with proper hanging indentation, like a real numbered list, rather than plain wrapped text.

**2026-07 — Ingredient row layout**
On the edit form, each ingredient is one row: index, amount, measure (unit dropdown), name — not four stacked fields. "Add ingredient" button sits at the bottom of the ingredient list, not the top, so adding another doesn't require scrolling up. On the read-only view page, ingredients are NOT shown as a table — each renders as a single line combining amount + unit + name (e.g. "25g Sugar", "1 lemon", "1 litre(s) Milk"), no index shown.

**2026-07 — Event attendees un-deferred (user assignment)**
Building out `EventAttendee` (previously deferred). Event add/edit form gets a "Who's this for" selector: Me / Nick / Both — creates one or two `EventAttendee` rows accordingly. This is assignment/visibility metadata only — NOT a permission system (per the existing "no permission levels" rule, both users still see and can edit everything regardless of assignment).

**2026-07 — User indicator (Paul/Nick) on cards**
Small coloured square: blue = Paul, pink = Nick, split/dual square = both. This is secondary to the existing event-type colour, which stays the primary badge/background on both Calendar events and Reminder cards. Same rule applies in both places — user square sits small, in a corner, not competing with the type colour for visual weight.

**2026-07 — Reminders/Calendar filters**
Both pages get a filter for Event Type and/or User (assigned user). On the Reminders page, the User filter defaults to the current logged-in user. No default filter specified for the Calendar page.

**2026-07 — Reminder card → Calendar navigation**
Clicking a reminder card navigates to the Calendar page with that event opened (e.g. its edit/view dialog auto-opened, calendar scrolled/jumped to its date). No "back to reminders" requirement — standard browser back covers it.

**2026-07 — Reminder date/time display format**
Format: "Wed 8th July 2026 at 1:15pm" — abbreviated day name, ordinal day number, full month name, full year, 12-hour time with lowercase am/pm, no space before am/pm. Needs a shared formatting utility (ordinal suffixes aren't built into Intl) — put it somewhere reusable in `lib/`, not duplicated per page.

**2026-07 — Recipe search**
Search box on `/recipes` filtering by title only (not ingredients or description), case-insensitive substring match.

**2026-07 — Watchlist page added (post-v1.0)**
New feature, table/row-based UI (first departure from the card pattern used elsewhere — appropriate here since it's inherently tabular data). `WatchlistEntry` model: name, source (FK to `WatchlistSource`), season, episode (both nullable — supports movies with no season/episode), status enum (TO_WATCH/WATCHING/WATCHED), `updatedAt` auto-managed via Prisma `@updatedAt` (no manual "last updated" field). `WatchlistSource` is a small user-manageable table (add/edit/remove), same pattern as `EventType` — seeded initially with Apple TV, Netflix, IP Stream, Prime, Terrestrial. Editing a row opens a popup/dialog, same pattern as Calendar events (not inline editing). Columns are sortable; filterable by Status and Source. Shared/no permissions, same as everything else.

**2026-08 — PWA manifest added from scratch (not a scope tweak)**
Investigated the "browser chrome bar covers menu on mobile" bug (`docs/improvements-scope-2026-08.md` Phase 0). The assumed root cause — a manifest `scope` that didn't cover all routes — didn't hold: the app had **no manifest, no PWA metadata, and no icon assets at all** prior to this change (confirmed via full-repo search and git history on all branches). The symptom matches iOS Safari's default "Add to Home Screen" behaviour for a site with no manifest/`apple-mobile-web-app-capable` tag: it bookmarks the site and opens it in minimal Safari chrome (URL bar + close button) rather than standalone.

Fix: added `app/manifest.ts` (Next.js's native manifest route, served at `/manifest.webmanifest` and auto-linked in `<head>`) with `scope: "/"`, `display: "standalone"`, `start_url: "/"`. Added `appleWebApp` + `icons.apple` to the `metadata` export in `app/layout.tsx`, and a `viewport.themeColor` export (`#4A6C8C`, matching the DESIGN.md accent). Icons are placeholders — `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — generated by resizing the existing `app/favicon.ico`, which is itself still the default Next.js/Vercel triangle logo, not real branding. Swap these for real branded artwork before this matters visually (tracked as a follow-up, not done here).

**iOS caches the manifest per home-screen icon** — testing this fix requires removing the existing home-screen icon (if one was added pre-fix) and re-adding it after deploy; a plain refresh won't pick up the change.

**2026-08 — Role field + PasswordResetToken added (Phase 1, step 1b)**
Schema-only step ahead of the admin page and password-reset flow. Added `Role { ADMIN, MEMBER }` enum and `role Role @default(MEMBER)` on `User`. Added `PasswordResetToken { id, token (unique), userId → User, expiresAt, createdAt }` with the inverse `passwordResetTokens` relation on `User`. Migration: `20260804092844_add_user_role_and_password_reset_token`, applied cleanly to the local dev DB only (Neon prod untouched — `migrate deploy` against prod is a deliberate separate step, not run here). Existing user `p@ulcozens.com` set to `role: ADMIN` via a one-off script against the dev DB (all other users stay `MEMBER`, the default). No UI/route changes in this step.

Note from the step 1a investigation this builds on: the scope doc's Phase 1 "current state" (no real `User` table, no household scoping) was already stale — `User`/`Household` and full `householdId` scoping across Event/Recipe/WatchlistEntry existed before this session. The real remaining Phase 1 work is the `role` field (done here), `PasswordResetToken` (done here), Resend-backed password reset (not started — no Resend dependency/env var exists yet), and the admin UI (not started).

**2026-08 — Forgot-password flow built on Resend (Phase 1, step 1c)**
`/login` gets a "Forgot password?" link → `/forgot-password` (email entry) → `/reset-password?token=…` (new password). Both pages are new top-level routes (outside the `(app)` group, same as `/login`) since they must work for logged-out users.

Discovered along the way: this app uses Next.js 16's `proxy.ts` (the renamed `middleware.ts`) to redirect unauthenticated requests to `/login`. It only allowlisted `/login` and `/api/auth/*` — the two new pages were getting silently redirected before rendering until `proxy.ts` was updated to also allowlist `/forgot-password` and `/reset-password`. Worth remembering for any future logged-out-accessible route: `proxy.ts` needs an explicit allowlist entry, it's not automatic.

**Flow**: `POST /api/auth/forgot-password` always returns the same generic message (`"If that email is registered, we've sent a reset link."`) regardless of whether the email exists — including when the Resend send call itself fails, so a delivery error can't be used to distinguish a real account from a fake one (verified: the error is caught and logged server-side, response stays identical either way). On an existing user, any unexpired `PasswordResetToken` rows for them are deleted before a new one is created (`token`: 32 random bytes, hex; `expiresAt`: +1h) — this is also what makes a previously-issued link stop working the moment a new one is requested. `/reset-password` validates the token server-side on page load (not just on submit) via `findValidPasswordResetToken`, showing an "invalid or expired" state with a link back to `/forgot-password` if the token is missing/wrong/expired. On successful reset, `PasswordResetToken` row is deleted — this is the single-use mechanism, no separate "used" flag.

**New password rule**: minimum 8 characters. No password strength rule existed anywhere in the codebase before this (login only checks non-empty, `prisma/seed.ts` generates random passwords) — 8 chars is a new baseline introduced here, not an existing convention being matched.

Scope: reset flow only, per the step-1c brief — admin page and profile page (self-service password change while logged in) are separate, not-yet-built steps.

**2026-08 — Resend sending domain fixed (follow-up to step 1c)**
The step-1c follow-up flagged above is resolved: a verified sending domain now exists (`support@decisionreadiness.com`), added to `.env` as `SENDER_EMAIL`. `app/api/auth/forgot-password/route.ts` now builds `from` as `` `Lifestyle Organiser <${process.env.SENDER_EMAIL}>` `` instead of the hardcoded Resend onboarding address.

Verified live: a throwaway test send to an `example.com` address still 422s, but that's Resend universally rejecting reserved documentation domains as a `to` address — unrelated to the sender-domain fix, and not a valid test of it. Sent a real test to `p@ulcozens.com` instead (the seeded local dev user) — no error logged, and Paul confirmed the email actually arrived. Domain fix confirmed working end-to-end, not just accepted by the API.

**2026-08 — Admin page built: Users + Households CRUD (Phase 1, step 1d)**
Role-gated `/admin` with two tabs (single page, shadcn `Tabs` — no separate sub-routes). Gated in two layers: `app/(app)/admin/layout.tsx` does a server-side `getCurrentUser()` check and `redirect('/reminders')` for non-admins before anything renders (not just hidden nav), and every admin API route independently calls a new `requireAdmin()` helper (`lib/current-user.ts`) that 403s non-admins — defense in depth, verified both layers live with a throwaway non-admin session (page: 307 redirect; API: real 403 JSON). `getCurrentUser()` now also selects `role`.

**Users tab**: list (name/email/household/role), create, edit (name/household/role), delete. Creating a user leaves `passwordHash: null` and calls the same `sendPasswordResetEmail()` used by the step-1c forgot-password flow — extracted out of `app/api/auth/forgot-password/route.ts` into `lib/password-reset.ts` specifically so this step could reuse it instead of duplicating the token/email logic. Verified: creating a user leaves no password set and does create a `PasswordResetToken` row via the shared function.

**Households tab**: list (name/member count), create, rename, delete.

**Safeguards, all server-side (not just UI), all verified live against the real dev DB via a throwaway admin session**:
- Can't delete your own account, ever (`CannotDeleteSelfError`, 400) — confirmed.
- Can't delete a user who has created Events or Recipes (`UserHasContentError`, 409, counts both) — confirmed by attempting to delete Paul's real account (6 events/recipes) and getting blocked; his account was untouched.
- Can't demote yourself off `ADMIN` if you're currently the *only* admin (`LastAdminError`, 400) — confirmed by temporarily demoting Paul to `MEMBER` on the local dev DB (making a throwaway test account the sole admin), attempting self-demotion via the real API and getting blocked, then immediately restoring Paul's role and re-verifying it stuck. Also confirmed the *permitted* case: self-demotion succeeds once there's more than one admin.
- Can't delete a household that still has users, Events, Recipes, or WatchlistEntries (`HouseholdInUseError`, 409) — confirmed against the real seed household.

All new error classes wired into the shared `errorResponse()` in `lib/api-errors.ts`, matching the existing `EventTypeInUseError`/`WatchlistSourceInUseError` pattern rather than inventing a new error-handling shape.

**UI**: first real usage of the shadcn `Table` primitive in the app (it existed unused before this). Both tabs follow the existing `WatchlistCards`/`WatchlistForm`/`ResponsiveDialog` BoardState (closed/create/edit) convention already used elsewhere, applied consistently to both tabs rather than mixing patterns. Nav: `NavLinks` takes an optional `isAdmin` prop, threaded from `AppLayout` (which now knows the session's `role`) through `TopNav` — "Admin" link only renders for admins, confirmed present/absent in both sessions.

Not touched in this step, per the brief: the profile page (1e, next).

**2026-08 — Reminders/Calendar/event form updated for N-user households**
The admin page (1d) made households with 3+ members a real, immediate scenario — the Calendar/Reminders "who's this for" UI was still hardcoded to exactly 2 people (`Who = 'ME' | 'OTHER' | 'BOTH'`), and both pages were silently discarding every household member past the first non-current one (`householdUsers.find(u => u.id !== currentUserId)`). Fixed across three areas, all agreed with Paul before implementation:

- **Reminders/Calendar filters**: the old three-option `ALL/ME/OTHER` `<Select>` is now a multi-select `DropdownMenu` (`DropdownMenuCheckboxItem`, no new dependency) over every household member plus "Everyone." Selecting multiple people is **OR** logic — an event shows if *any* selected person is an attendee, matching how "Both" used to behave and how filters work elsewhere in the app (e.g. Watchlist). `lib/event-filters.ts`'s `UserFilterValue` type is gone; `filterEventsByTypeAndUser` now just takes `userFilter: string[]` (empty = no filter). Reminders still defaults to `[currentUserId]` (self only); Calendar still defaults to everyone.
- **Add/edit event "who's this for"**: replaced with a checkbox list (added shadcn `Checkbox`) over the household roster, plus a "Select all" shortcut button. "All" is a **snapshot**, not a dynamic flag — it just checks every *current* member's box and submits their IDs like any other selection; someone added to the household later isn't retroactively added to past events, same as the rest of `attendeeUserIds` (no schema change needed, the API was already `string[]` under the hood — see 1d's research).
- **Attendee indicator**: the "blue = Paul, pink = Nick, split square = both" indicator (`lib/user-colors.ts`, hardcoded name-string → 2-color mapping) couldn't represent 3+ attendees and was actively misleading once households exceed 2 people. Per Paul's call, dropped color-coding entirely in favor of a relative-to-viewer `Badge`: **"Me"** / **"Me + other(s)"** / **"Other(s)"** — no longer tries to identify *which* other person, just whether you're in it and whether anyone else is too. `lib/user-colors.ts` deleted; `--user-blue`/`--user-pink` removed from `app/globals.css`.
- **Small opportunistic fix while in this code**: `attendeeUserIds` was never validated server-side against household membership (pre-existing gap, not part of the original 2-user bug). Added `assertAttendeesInHousehold` in `lib/events.ts` (`InvalidAttendeesError`, 400) — confirmed live that submitting a foreign user ID is now rejected.

Verified live against a real 4-person household (Paul, Nick, plus two more Paul added via the new admin page) on Paul's own running dev server: multi-attendee event creation, the household-membership rejection, and both pages rendering without error. One transient console error Paul saw mid-session (`householdUsers.map` on `undefined`) was from `RemindersBoard`/`EventFilters`/the Reminders page being edited non-atomically while his dev server's Fast Refresh was live-watching — confirmed resolved once all edits landed (clean `tsc`/`next build`, and a fresh request against his running server after returned 200 with no errors).

**2026-08 — Two Reminders-card UI tweaks (post-N-user feedback)**
Feedback after the N-user change shipped: (1) the attendee `Badge` and the due date/time were still overlapping on `UpcomingReminderRow` even after an earlier padding attempt — root cause was the badge being `absolute top-2 right-2` on the `Card`, floating over content instead of participating in layout. Fixed by removing the absolute positioning entirely: `CardContent` is now a row with title/badges on the left and a right-aligned column (indicator stacked above the due date/time) on the right, so they can never overlap regardless of how much the left side wraps. (2) Paul preferred the dynamic `Other`/`Others` pluralization over the fixed `Other(s)` from the first pass, just properly title-cased throughout (`Me`, `Me + Other`, `Me + Others`, `Other`, `Others`) — the bug was really just the lowercase `other` inside the `Me + other(s)` compound label, not the pluralization style itself.

**2026-08 — Disable-login for users (Phase 1, follow-up to 1d)**
Gap Paul noticed on the admin page: a user with created Events/Recipes can't be deleted (`UserHasContentError`, by design — no silent cascade), but there was no way to lock them out short of deletion. Added `User.isActive` (`Boolean @default(true)`, migration `20260804160328_add_user_is_active`).

- **Login**: `lib/auth.ts`'s `authorize()` now checks `isActive` *after* password verification (deliberately — checking after means a wrong-password guess against a disabled account still just gets "incorrect email or password," only the account owner with the *correct* password learns their account is disabled). Rejection is a custom `AccountDisabledSignin extends CredentialsSignin` with `code = 'account_disabled'`; the login page checks `result.code` and shows "This account has been disabled." instead of the generic message — a deliberate choice (confirmed with Paul) over Auth.js's usual "don't reveal account state" convention, since this is a private household app with no public signup, not a public-facing service.
- **Live sessions**: `getCurrentUser()` already re-queries the DB on every request (it's `react cache()`-wrapped per-request, not cached across requests), so adding an `isActive` check there means disabling someone kills their *current* session immediately too — `redirect('/login')`, not a thrown error, since this is an expected/reachable state via normal admin action (unlike the adjacent "no household assigned" check, which stays a thrown `Error` because it should never happen). No separate session-invalidation mechanism needed.
- **Admin UI**: `UserForm` gets an "Account active" `Switch`, edit-mode only (new users are always active — no toggle on create). Mirrors the existing self-delete safeguard: `CannotDisableSelfError` (400) blocks disabling your own account, switch disabled client-side too when editing yourself. Users table gets a Status column — blank when active, a `Badge variant="destructive"` reading "Disabled" otherwise.
- Disabling does **not** touch a user's historical data or remove them from household pickers/filters/attendee lists — it only blocks login. That's the whole point: an alternative to deletion for someone who has content tied to their account.

**Testing note**: hit a real gotcha while verifying this live — Paul's already-running dev server (started before this session's migration) returned a false "disabled" for a genuinely active test user, because its in-memory Prisma client predated the `isActive` column (so the field came back `undefined` → falsy). Not a bug in the code — confirmed by running an isolated `next start` on a separate port with a freshly generated client, where the full cycle (active → login works → disabled via admin → live session killed → login rejected with the specific message → re-enabled via admin → login works again) all passed clean. **Flagging for Paul: his running dev server needs a restart to pick up this migration correctly** — this is a recurring Prisma+Next dev-server caveat (schema/generated-client changes don't always hot-reload; the TS/React file layer does).
