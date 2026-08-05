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

**2026-08 — Books section added (Phase 2)**
New `Book` model + `BookSource` reference table, following the Recipes/Watchlist patterns established in Phase 1.

- **`BookSource`**: global table (no `householdId`), same pattern as `EventType`/`WatchlistSource` — shared across households rather than per-household, user-manageable (add/edit/delete via a "Manage sources" dialog on the Books list page, reusing the `WatchlistSourceManager` component shape). Seeded with Kindle, Physical Book, Audiobook, Library — matching the existing `WATCHLIST_SOURCES` seed convention in `prisma/seed.ts`.
- **`BookStatus` enum**: `TO_READ`, `READING`, `READ` (default `TO_READ`). Ordered chronologically to match `WatchStatus`'s convention (`TO_WATCH`/`WATCHING`/`WATCHED`) rather than the literal order given in the original brief — cosmetic only, doesn't affect behaviour, confirmed with Paul before implementing.
- **`Book.reader`**: a single required FK to `User` (not a many-to-many like `EventAttendee`) — a book has exactly one reader. Defaults to the current logged-in user on the add form, editable via a dropdown of the current household's members (`listHouseholdUsers`).
- **Routing**: dedicated pages rather than Watchlist's dialog-based editing — `/books` (card list, title-only search, same as Recipes), `/books/[id]` (read-only detail view, all fields), `/books/[id]/edit`, `/books/new` (full-page `BookForm`, same shape as `RecipeForm`/`WatchlistForm`). Chosen over the Watchlist single-page-plus-dialog pattern because the brief explicitly asked for a separate "detail view" distinct from editing, and `Book` has more fields (8) than a `WatchlistEntry` (5) — closer to `Recipe`'s complexity.
- Household scoping follows the existing convention exactly: every query in `lib/books.ts` filtered by `householdId`, sourced from `getCurrentUser()`, same as `lib/recipes.ts`/`lib/watchlist.ts`.
- Nav: `/books` added to `NavLinks` after Watchlist.

**2026-08 — Books list layout + rating field (follow-up)**
Three tweaks after initial Books feedback:
- List view (`BookGrid`) changed from a 3-column card grid to a single-column stacked list — one book per row rather than the Recipes-style grid, since Book cards carry more text (summary) than Recipe cards.
- `BookCard` now shows `summary` (2-line clamp), matching how `RecipeCard` shows `description`.
- Added `Book.rating` (`Int?`, 1–5, nullable — null means not rated), migration `20260804181430_add_book_rating`. Exposed as a `Select` on `BookForm` ("No rating" / "1 Star" … "5 Stars", via a `NO_RATING` sentinel matching the `NO_UNIT` pattern in `RecipeForm`), and displayed as five `lucide-react` `Star` icons (filled up to the rating) via a new `StarRating` component — reused on both the card and the detail view for consistency, not just where it was asked for.

**2026-08 — Books filterable by rating (follow-up)**
Added a rating filter to the Books list, alongside the existing title search. `lib/book-filters.ts`'s `filterBooks()` combines both (search AND rating, same pattern as `filterWatchlistEntries` combining status/source) — options are "All ratings", 1–5 Stars (exact match), and "Not rated" (`rating === null`). The generic "No books match the current filters." message replaced the old search-only "No books match &ldquo;{search}&rdquo;." text, since a result can now be empty due to the rating filter alone.

**2026-08 — Book cover image (follow-up)**
Added `Book.imageUrl` (`String?`, nullable — matching `Recipe.imageUrl`), migration `20260804183342_add_book_image`. Upload mechanics copied exactly from Recipes: `app/api/books/upload/route.ts` mirrors `app/api/recipes/upload/route.ts` (same 8MB limit, same `image/*` MIME check, same `@vercel/blob` `put()` call, just a `books/` key prefix instead of `recipes/`), and `BookForm`'s photo block is the same upload/replace/remove UI as `RecipeForm`'s.

Placement differs from Recipes because Book's list view is a single-column stacked list (per the earlier "single rows" change), not a grid — a full-width `aspect-video` hero per row (Recipe's approach) would waste vertical space, so `BookCard` uses a small fixed `h-20 w-14` cover thumbnail on the left of each row instead, with a `BookOpen` icon fallback when there's no image (same fallback-icon convention as `RecipeCard`'s `ChefHat`). The detail view (`/books/[id]`) uses a larger `h-32 w-24` cover next to the title, same fallback treatment.

**2026-08 — Profile page with category tabs (Phase 3, Item 2)**
`improvements-scope-2026-08.md`'s Phase 3 brief assumed a profile page already existed (from step 1e in Phase 1) to add tabs to. It didn't — 1e (self-service edit name + change password) was scoped but, per the 1c/1d entries above, explicitly never built. Flagged this to Paul; agreed to skip 1e entirely (no self-service name/password editing) and build only the tabbed category view as a new `/profile` page. 1e stays permanently out of scope unless raised again separately — not tracked as a follow-up here.

**Tabs**: shadcn `Tabs`, `defaultValue="all"` — All / Reminders/Calendar / Recipes / Watchlist / Books, matching the brief's exact order and labels. `TabsList` wrapped in `overflow-x-auto` since five triggers don't fit one mobile viewport width; verified live that "Books" (the clipped one) is still reachable by scroll+tap on a 390px-wide viewport.

**"Belongs to this user" per category** — decided per what each model actually tracks, not a uniform rule:
- **Reminders/Calendar**: unfiltered data (`listUpcomingReminders`) handed to the existing `RemindersBoard` unchanged — it already defaults its own user filter to the viewer and exposes the same `EventFilters` UI as `/reminders`, so this tab's behaviour is identical to the dedicated page by construction, not a reimplementation.
- **Recipes**: filtered by `Recipe.authorId === currentUserId`. `authorId` is set server-side on create (not a user-editable "assign to" field) but is a genuine, meaningful "who added this" — reasonable reading of ownership for a shared but attributed collection.
- **Books**: filtered by `Book.readerId === currentUserId`, per the brief's own hint — `reader` is literally the field the model uses to track whose book it is.
- **Watchlist**: **not filtered** — `WatchlistEntry` has no creator/assignee field of any kind (confirmed in `prisma/schema.prisma`), so "belongs to this user" isn't expressible for this model. The tab shows the full household list, same as `/watchlist`.

**Composition, not new components**: four small wrapper components (`components/profile/profile-{reminders,recipes,watchlist,books}-section.tsx`) each reuse the existing card/list component for that category (`RemindersBoard`, `RecipeGrid`, `WatchlistCards`, `BookGrid`) and that category's existing empty-state icon/copy from its dedicated page — no new list/card UI was built. The "All" tab stacks all four sections vertically; each dedicated tab renders just its own section — same components and same section wrappers in both places, not duplicated JSX. Each section header also got a small "View all →" link back to the dedicated page (not explicitly requested, but low-risk and useful since every tab shows a filtered subset).

**Nav**: added a "Profile" item to the `UserMenu` account dropdown (above "Sign out"), not the top `NavLinks` bar — account-level pages conventionally live under the avatar menu, and the top nav was already at six items (Reminders/Calendar/Recipes/Watchlist/Books/Admin).

Verified live end-to-end against the real dev DB/session: all five tabs, correct per-category filtering (Recipes/Books show only Paul's items, Watchlist shows the full shared list), and mobile viewport tab-bar scrolling. No schema changes, no changes to any of the four dedicated pages.

**2026-08 — Household-level section toggles (Phase 3b)**
Admin-controlled, household-wide visibility for Calendar, Recipes, Watchlist, and Books — no per-user preference. Added `showCalendar`/`showRecipes`/`showWatchlist`/`showBooks` (`Boolean @default(true)` each) to `Household`, migration `20260804194105_add_household_section_toggles`. Purely a visibility toggle — disabling a section doesn't touch its underlying data (`Recipe`/`Book`/`WatchlistEntry`/`Event` rows are untouched, just hidden). Reminders has no toggle of its own — it's a filtered view of `Event`, not a separate model, so it rides along with `showCalendar` everywhere (nav, page guard).

**`lib/household-sections.ts` vs `lib/current-user.ts` split — a real build failure, not a style choice.** First pass put both the client-safe constants (`SectionKey`, `SectionFlags`, `SECTION_KEYS`, `SECTION_META`) *and* a server-only `requireSection()` (which calls `getCurrentUser()`) in one `lib/household-sections.ts` file. `HouseholdForm` (a client component) needs `SECTION_KEYS`/`SECTION_META` for its checkboxes, and importing anything from that file pulled in `requireSection`'s import of `getCurrentUser` → `prisma` → `pg` into the client bundle, which failed the build (`Module not found: util/types`, `node:module` unsupported in the browser chunking context). Fixed by moving `requireSection` into `lib/current-user.ts` itself (already server-only, sits next to `requireAdmin`), leaving `lib/household-sections.ts` as pure types/constants with zero imports. Worth remembering: a lib file with both client-safe exports and a server-only function that imports Prisma will silently break any client component that imports *any* export from it, not just the server-only one — split by import-safety, not by topic.

**`getCurrentUser()`** now also selects the household's four flags and exposes them as `sections: SectionFlags` — one extra nested `select`, same `react cache()` per-request caching as the existing `role`/`isActive` fields, so no new query volume anywhere that already calls it.

**Enforcement, three layers, all live-verified**:
- **Nav**: `NavLinks` (`components/nav/nav-links.tsx`) filters its link list by `sections` before rendering; Reminders and Calendar both key off `showCalendar`. `TopNav`/`AppLayout` thread `sections` through from `getCurrentUser()`.
- **Direct URL**: every page under a toggleable section — not just the index route — swapped `getCurrentUser()` for `requireSection('...')`: `calendar/page.tsx`, `reminders/page.tsx` (both `'calendar'`), `recipes/page.tsx` + `[id]/page.tsx` + `[id]/edit/page.tsx` + `new/page.tsx` (`'recipes'`), `watchlist/page.tsx` (`'watchlist'`), and the four Books pages (`'books'`). `requireSection` redirects server-side to `/profile` — confirmed live that `/recipes`, `/recipes/new`, and `/watchlist` all redirect once disabled, while `/books` and `/calendar` (left enabled) still work.
- **Profile page**: `app/(app)/profile/page.tsx` only *fetches* data for enabled sections (skips the query entirely rather than fetching and hiding), and `ProfileTabs` only renders tab triggers/content for enabled sections — confirmed live that disabling Recipes/Watchlist drops them from both the tab bar and the "All" tab's stacked sections.

**Admin UI**: `HouseholdForm` gets a "Section types" checkbox group (shadcn `Checkbox`, same idiom as the event "who's this for" list), shared on both create and edit via the same component. **Safeguard**: `householdInputSchema` gets a `.refine()` requiring at least one section `true` — reuses the existing generic `ZodError` → 400 handling in `errorResponse` (no new error class). Mirrored client-side in `HouseholdForm` (Save button disabled + inline message when all four are unchecked) — confirmed live both the disabled Save button and, separately, that the server rejects a same-shaped request.

Verified live end-to-end against the real dev household: disabled Recipes+Watchlist → nav and Profile tabs updated correctly, direct navigation to all three disabled routes (including `/recipes/new`) redirected to `/profile`, Books/Calendar stayed reachable, the all-off safeguard blocked Save, then restored all four flags and confirmed the nav/pages returned to normal. Zero console errors throughout.

**2026-08 — Dark mode + background pattern (Phase 5, Item 5)**
Investigated before building, per the brief's explicit ask to report findings first: dark mode was **not** wired despite appearances — `dark:` utility classes already exist throughout the shadcn primitives (`button.tsx`, `input.tsx`, `badge.tsx`, etc.), but those are stock component styling with no actual dark colour palette behind them. `app/globals.css` only ever defined `:root` (light) values; there was no `.dark` class block, no `next-themes` dependency, no `@custom-variant dark` override (Tailwind v4 needs this to make `dark:` follow a `.dark` class rather than the raw OS media query), no toggle UI, and no persistence. `DESIGN.md` had flagged this as deferred ("dark mode equivalent near-black later if added") and it was never followed up. Separately, the brief assumed a distinct "mobile drawer" nav exists — it doesn't; `TopNav`/`NavLinks` is one responsive bar shared by mobile and desktop, so the toggle only needed adding in one place.

**Stack**: `next-themes`, `attribute="class"`, `defaultTheme="system"` + `enableSystem` — wraps `{children}` in `app/layout.tsx` via a thin `components/theme-provider.tsx` client wrapper (kept separate from the root layout so the root layout itself can stay a server component). `<html suppressHydrationWarning>` — required by next-themes since the resolved theme is only known client-side before hydration.

**Palette**: every `:root` colour token got a `.dark` equivalent in `app/globals.css` (near-black `#171717` background, off-white `#EDEDED` text — not pure black/white, matching the light palette's existing "softer than pure black" principle). `primary`/`destructive`/`warning` were each independently lightened rather than reused as-is from light mode, since they're used both as solid button fills *and* as bare text/badge colours (e.g. `Badge variant="destructive"` renders `text-destructive` directly on the dark background), so they needed enough standalone contrast, not just enough contrast when painted as a button. Left `--chart-*`/`--sidebar-*` unstyled for dark mode — unused anywhere in the app (no chart or sidebar UI), not worth theming speculatively.

**Toggle**: `components/nav/theme-toggle.tsx` — icon button (`Sun`/`Moon`, `lucide-react`), `useTheme()` from next-themes, flips `resolvedTheme` between `'light'`/`'dark'` explicitly on click (not a three-way light/system/dark cycle — matches the brief's "icon button... override the system setting" ask). Has a `mounted` guard before rendering the theme-dependent icon, to avoid a hydration mismatch (server has no notion of OS preference or the `localStorage` override). Added into `TopNav` next to `UserMenu` — the one shared nav bar, not a separate mobile drawer.

**Background pattern**: a tiled dot grid, inlined as an SVG `data:` URI behind a `--pattern-dot` CSS variable, swapped light/dark the same way as the colour tokens (defined once in `:root`, overridden in `.dark`). Applied via a `.app-pattern-bg` utility class on the `(app)` layout's shell `<div>` — scoped to the authenticated app, not the login/forgot-password pages. Deliberately erred toward too faint per the brief: `5%`/`6%` `fill-opacity` (light/dark), a single `r="1"` circle per `20×20px` tile. Confirmed at actual size in a close-up screenshot crop that it reads as a barely-perceptible texture in both themes, not a visible grid.

**Verified live** (Playwright, three separate browser contexts): a fresh session with OS light preference defaults to the `light` class; clicking the toggle switches to `dark`, sets `localStorage`, and persists across a reload even though the OS context is still light (manual override wins over system, as intended); a separate fresh session with OS dark preference defaults to `dark` automatically with no manual interaction. Zero console errors in any case — confirms no hydration mismatch from the `suppressHydrationWarning` + `mounted`-guard approach.

**2026-08 — Mobile nav overflow, twice (follow-up to dark mode)**
Adding the theme toggle pushed an already-tight top nav past the mobile viewport width. Fixed in two passes:
1. Nav links switched to icon-first (`lucide-react`: Bell/Calendar/ChefHat/Tv/BookOpen for Reminders/Calendar/Recipes/Watchlist/Books, `Shield` for Admin), with the text label hidden below `lg:` rather than `sm:`. First attempt used `sm:` (640px) to match the existing "Lifestyle Organiser" brand-text breakpoint, but at that width six labelled items plus the brand text didn't fit — confirmed via `document.documentElement.scrollWidth` vs `clientWidth` across a full width sweep that adding `whitespace-nowrap` (to stop the brand text wrapping to two lines) just traded that for genuine page-wide horizontal overflow from ~640–950px. Moved both the brand text and the nav labels to `lg:` (1024px) instead — confirmed via the same sweep to have no overflow anywhere from 1024px up to 1440px.
2. Follow-up: the icon-only tap targets below `lg:` were only 16×16px (bare icon, no padding) with a 12px gap — well under the ~44px touch-target guideline. Added `p-2` + `rounded-lg` + `hover:bg-muted` to each link (cancelled via `lg:p-0 lg:hover:bg-transparent` once labels appear, since desktop's fit had zero spare width), and tightened the inter-item gap to `gap-1` to make room. Landed on 32×32px tap targets — double the original, and matching the existing `ThemeToggle`/avatar button size for visual consistency — after an initial `p-2.5` attempt reintroduced overflow at the narrowest common phone width (320px), confirmed via the same overflow sweep.

Both fixes verified via a Playwright width sweep from 320px–1440px (`scrollWidth === clientWidth` at every step) plus close-up screenshots for the actual tap-target size and pattern/icon legibility — not just spot-checked at one viewport.

**2026-08 — Watchlist rating, mirrored from Books**
Added `WatchlistEntry.rating` (`Int?`, 1–5, nullable), migration `20260804204842_add_watchlist_rating` — same shape as `Book.rating`, same `Select` UI in `WatchlistForm` (`NO_RATING` sentinel), same `StarRating` display next to the status badge, same rating filter (`ALL_RATINGS`/`NOT_RATED` sentinels) alongside the existing status/source filters in `WatchlistCards`.

Refactored the rating building blocks to be shared rather than duplicated a second time: `lib/book-rating.ts` → `lib/rating.ts` (`RATINGS`, `Rating`, `ratingLabel` — generic, not book-specific) and `components/books/star-rating.tsx` → `components/star-rating.tsx`. Unlike `BookStatus`/`WatchStatus` (deliberately kept as separate per-domain files — the actual label text differs: "To Read" vs "To Watch"), the star-rating UI and "1 Star"/"2 Stars" labels are identical text for both domains, so duplicating them the way status labels are duplicated would have been pure copy-paste with no domain-specific content — generalized instead, same category as already-shared `EmptyState`/`ResponsiveDialog`. All existing Books call sites (`BookCard`, `BookForm`, `BookGrid`, the book detail page) updated to the new import paths; old files deleted rather than left as re-exports.

Verified live: Books rating still renders correctly after the refactor (sanity check, not assumed), then the full Watchlist cycle — add an entry with a rating, filter by that exact rating, filter by "Not rated" (correctly excludes it), edit the rating, delete. Zero console errors throughout.

**2026-08 — Home-screen icon label ("LifestyleOrganiser" with no space) — not a typo**
Paul reported the iOS home-screen shortcut showing "LifestyleOrganiser" with no space, while the manifest name is correctly "Lifestyle Organiser". Investigated thoroughly before touching anything: grepped the whole repo (including case-insensitive and underscore variants) for a hardcoded "LifestyleOrganiser" — zero matches, anywhere. Checked full git history on `app/manifest.ts` and `app/layout.tsx` — the name has been correctly spaced in every commit since either file existed. Verified live via Playwright (logged-in session): `document.title`, the rendered `TopNav` brand text, and the actual `/manifest.webmanifest` JSON response all returned "Lifestyle Organiser" correctly. There was no missing-space bug in the code at all.

Root cause, once Paul confirmed it was specifically the *installed home-screen icon* label: iOS wraps long home-screen labels onto two lines under a fixed-width icon rather than truncating. "Lifestyle Organiser" (20 characters) doesn't fit on one line, so it wraps to "Lifestyle" / "Organiser" stacked — and at small icon-grid text size, two stacked words with no visible space character between the lines reads exactly like one concatenated word. The actual bug: `app/manifest.ts`'s `short_name` — the manifest field that exists specifically for constrained-space labels like this — was set to the full "Lifestyle Organiser", identical to `name`, so it wasn't actually short. `app/layout.tsx` already had an `apple-mobile-web-app-title` meta tag set to `"Organiser"` alone (an earlier, never-finished attempt at the same fix), but nothing had made the manifest's own `short_name` match it, so which string iOS actually picked up was inconsistent depending on whether it read the meta tag or the manifest.

Fix: `short_name: "Organiser"` in `app/manifest.ts`, matching the existing `apple-mobile-web-app-title`. `name` stays the full "Lifestyle Organiser" (used for app-install banners/descriptions, not the icon label). Confirmed live that `/manifest.webmanifest` now returns `short_name: "Organiser"` while `name` and the on-page title are unaffected. Per the existing iOS-manifest-caching caveat above, Paul still needs to remove and re-add the home-screen icon to pick this up — a refresh alone won't do it.

**2026-08 — Loading states via `loading.tsx` (perceived-wait polish)**
Added a root `app/loading.tsx` (centered `lucide-react` `Loader2` spin + "Loading..." text, theme tokens only) as the fallback for any route without a more specific boundary — mainly the pattern-less auth pages (login, forgot/reset-password) and `/admin`, which wasn't judged heavy enough to need its own skeleton. It deliberately doesn't carry the `.app-pattern-bg` dot texture itself, since that class only lives on the `(app)` shell div in `app/(app)/layout.tsx`; a plain `bg-background`/`text-foreground` fallback can't clash with a ~5–6%-opacity pattern either way, and it also has to look right on the pattern-less auth pages it covers.

Recipes, Reminders, and Watchlist already had their own segment `loading.tsx` (`Skeleton`-based, shape-matched to each page) from earlier work. Added the same for the three that were missing — Calendar (heading + toolbar row + one large block standing in for the FullCalendar grid), Books (heading/action-buttons row + stacked row skeletons, matching Books' single-column list layout), and Profile (heading + 5-tab bar + stacked section blocks, matching the default "All" tab). Segment-level `loading.tsx` matters here specifically because without one, Next.js bubbles the suspense boundary up to the root `loading.tsx`, which would unmount `TopNav` and the pattern background during the page's data fetch rather than just swapping the content area.

No manual spinner/`useState`-based loading UI existed anywhere to remove — this was purely additive. Doesn't address underlying latency; that's still Phase 4's diagnostic pass, not this change.
