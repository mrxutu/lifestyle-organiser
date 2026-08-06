# Lifestyle App — Improvements Scope (Aug 2026)

Seven requested improvements, sequenced into phases by dependency. Hand each phase to George as its own prompt, with "outline the plan first" per usual.

---

## Phase 0 — Mobile PWA scope fix (quick win)

**Problem:** on non-home pages, a browser-style bar (URL + close icon) covers the menu; tapping it returns to the homepage.

**Likely cause:** the web app manifest's `scope` (and possibly `start_url`) doesn't cover all app routes. iOS/Android wrap any page outside the declared PWA scope in a mini-browser chrome.

**Fix:** set `scope: "/"` in the manifest, confirm `display: "standalone"`, confirm `start_url` is correct. Note: iOS often requires removing and re-adding the home-screen icon for manifest changes to take effect — test on a real device.

No dependencies. Do this whenever.

---

## Phase 1 — User, auth & household overhaul (Items 1 + 7)

The foundational phase. Everything else that references "which user" or "which family" depends on this. Terminology note: the codebase already uses **Household** (not "Family") — scope doc updated to match.

**Current state (confirmed via George audit, 2026-08):** further along than this doc originally assumed — 1a is done, no retrofit needed.
- Auth is already real: NextAuth v5 Credentials provider, DB-backed via `prisma.user.findUnique`, bcrypt-verified against `User.passwordHash` (`lib/auth.ts`).
- `User { id, email, name?, passwordHash?, householdId? }` and `Household { id, name }` already exist and are wired up.
- `Event`, `Recipe`, `WatchlistEntry` already have a **required** `householdId` and every query/mutation in `lib/events.ts`, `lib/recipes.ts`, `lib/watchlist.ts` is already scoped by it, sourced from `getCurrentUser()`. No unscoped reads/writes found. `EventType`/`WatchlistSource` intentionally have no `householdId` (global reference tables).
- No `role` field on `User` — no admin/member distinction exists yet.
- No `/admin` route or any household/role management UI exists.
- Resend is **not** installed — no package, no API key, no send function anywhere. Fully net-new.

**Remaining work (narrower than originally scoped):**
- **1b — Schema:** add `role` (enum: `ADMIN | MEMBER`) to `User`, add `PasswordResetToken { id, token, userId, expiresAt }`. Seed/migrate Paul's existing record to `ADMIN`. Low-risk additive migration — no retrofit needed elsewhere.
- **1c — Password reset:** install Resend, build forgot-password request → email → reset page → token validation/expiry/single-use. Prerequisite: Paul signs up for Resend and adds the API key to Vercel env vars before this prompt goes to George — that's an external account step, not something George can do.
- **1d — Admin page:** role-gated `/admin` (checks `role === 'ADMIN'`). CRUD for Users (create/edit/assign household/delete), CRUD for Households (create/rename).
- **1e — Profile page (baseline):** self-service edit name + change password (logged-in flow, no token needed — separate from 1c's reset-via-email flow).

No further data-scoping retrofit needed — that part was already built. Sequence: 1b → 1c and 1d (can run in either order, both depend only on 1b) → 1e.

---

## Phase 2 — Books section (Item 4)

Depends on Phase 1 (needs a real `User` for `Reader`, `householdId` for scoping).

**Model:**
```
Book {
  id
  title
  author
  summary
  dateRead
  status     BookStatus  (READ | READING | TO_READ)  — Prisma enum
  sourceId   → BookSource
  notes
  readerId   → User
  householdId → Household
}

BookSource { id, name, householdId? }  — DB table, not a Prisma enum
```
`BookSource` follows the `EventType`/`WatchlistSource` pattern: a user-manageable table rather than a hardcoded enum, seeded with a starting list (Kindle, Physical Book, Audiobook, Library — confirm seed list with George) and extendable later without a migration. `BookStatus` stays a plain Prisma enum, matching `WatchStatus`.

**UI:** same pattern as Recipes and Watchlist — card list view + card detail view. Title-only search, consistent with Recipes.

---

## Phase 3 — Profile page with category tabs (Item 2)

Tabs: Reminders/Calendar, Recipes, Watchlist, Books — defaults to an "All" combined view.

Watchlist is already built (Recipes-style pattern), so no blocker there. This phase just needs Phase 1 (household scoping) and Phase 2 (Books) done first.

---

## Phase 4 — Performance (Item 3)

Investigate before deciding on a host/DB change:
- Neon's serverless tier scales to zero — cold starts on the DB connection are a common cause of "slow first load." Check current Neon plan/tier.
- Check for N+1 queries, especially once Phase 1 adds `householdId` filters everywhere.
- Check image sizes from Vercel Blob (recipe photos, future book covers).

Recommend a short diagnostic pass with George (Vercel analytics + Neon query logs) before committing to a host or DB migration — the fix might be pooling/config, not a platform switch.

---

## Phase 5 — Light/dark mode with background images (Item 5)

- Confirm whether dark mode is already wired via shadcn/Tailwind, or needs `next-themes` added.
- Background images: fixed set (not AI-generated per-user), subtle, tiled/repeating pattern similar to WhatsApp's chat background — one for light mode, one for dark. Store via Vercel Blob if needed. Update `DESIGN.md` once the actual images are chosen.

Independent of other phases — schedule whenever.

---

## Suggested order

Phase 0 → Phase 1 → Phase 2 → Phase 3, with Phase 4 and Phase 5 slotted in wherever convenient since they're independent.

## Status

All open questions resolved. Ready to turn Phase 0 and Phase 1 into concrete prompts for George.
