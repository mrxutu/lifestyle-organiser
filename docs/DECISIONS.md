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
