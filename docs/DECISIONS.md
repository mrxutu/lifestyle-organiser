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