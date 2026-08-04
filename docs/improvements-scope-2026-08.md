# Lifestyle App — Improvements Scope (Aug 2026)

Seven requested improvements, sequenced into phases by dependency. Hand each phase to George as its own prompt, with "outline the plan first" per usual.

---

## Phase 0 — Mobile PWA scope fix (quick win)

**Problem:** on non-home pages, a browser-style bar (URL + close icon) covers the menu; tapping it returns to the homepage.

**Likely cause:** the web app manifest's `scope` (and possibly `start_url`) doesn't cover all app routes. iOS/Android wrap any page outside the declared PWA scope in a mini-browser chrome.

**Fix:** set `scope: "/"` in the manifest, confirm `display: "standalone"`, confirm `start_url` is correct. Note: iOS often requires removing and re-adding the home-screen icon for manifest changes to take effect — test on a real device.

No dependencies. Do this whenever.

---

## Phase 1 — User, auth & family overhaul (Items 1 + 7)

The foundational phase. Everything else that references "which user" or "which family" depends on this.

**Current state:** Auth.js with two hardcoded users (Paul, Nick) — no real User table, no passwords to reset.

**New models:**
- `Family { id, name, createdAt }`
- `User { id, name, email, passwordHash, familyId, role: MEMBER | ADMIN, createdAt }`
- `PasswordResetToken { id, token, userId, expiresAt }`

**Auth changes:**
- Replace hardcoded credentials with DB-backed users.
- "Forgot password" on login → email with reset link → reset page. Needs an email-sending service (Resend is the common pick on Vercel) — flag as new dependency/cost.
- Profile page (baseline): edit own name, change password.

**Admin:**
- Admin page to create/edit Users, assign them to Families, create/rename Families.
- Role-gated on Paul's existing login (`role: ADMIN` on his User record gates `/admin`) — no separate admin credential set.

**Data retrofit (the big one):**
- Add `familyId` to `Event`, `Recipe`, and (once built) `WatchlistEntry` and the new `Book`.
- Every existing query/mutation across Calendar, Reminders, and Recipes needs a `familyId` filter from the session.
- **Migration:** backfill a single "family" containing Paul + Nick before this ships, so existing prod data doesn't orphan.

This phase touches auth, the DB schema, and every existing feature's queries — treat it as its own multi-session block of work with George, not a one-shot prompt.

---

## Phase 2 — Books section (Item 4)

Depends on Phase 1 (needs a real `User` for `Reader`, `familyId` for scoping).

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
  familyId   → Family
}

BookSource { id, name, familyId? }  — DB table, not a Prisma enum
```
`BookSource` follows the `EventType`/`WatchlistSource` pattern: a user-manageable table rather than a hardcoded enum, seeded with a starting list (Kindle, Physical Book, Audiobook, Library — confirm seed list with George) and extendable later without a migration. `BookStatus` stays a plain Prisma enum, matching `WatchStatus`.

**UI:** same pattern as Recipes and Watchlist — card list view + card detail view. Title-only search, consistent with Recipes.

---

## Phase 3 — Profile page with category tabs (Item 2)

Tabs: Reminders/Calendar, Recipes, Watchlist, Books — defaults to an "All" combined view.

Watchlist is already built (Recipes-style pattern), so no blocker there. This phase just needs Phase 1 (family scoping) and Phase 2 (Books) done first.

---

## Phase 4 — Performance (Item 3)

Investigate before deciding on a host/DB change:
- Neon's serverless tier scales to zero — cold starts on the DB connection are a common cause of "slow first load." Check current Neon plan/tier.
- Check for N+1 queries, especially once Phase 1 adds `familyId` filters everywhere.
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
