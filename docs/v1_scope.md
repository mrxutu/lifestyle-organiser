# Lifestyle Organiser — v1.0 Scope

**Status: v1.0 shipped — live on Vercel/Neon, July 2026.**

## Purpose
A shared web app for a household of two (you + Nick) to manage renewal reminders, a colour-coded events calendar, and a recipe collection — accessible from phone, tablet, and laptop.

## In scope for v1.0

### 1. Events calendar (includes reminders)
Reminders are not a separate feature — they're events with a lead time set. One data model, two views.
- Add/edit/delete events (weekends away, appointments, insurance renewals, bills, etc.)
- Event type/category with an assigned colour, calendar renders colour-coded
- Start/end date-time, all-day option, location field
- Recurrence: none / monthly / quarterly / yearly
- "Remind Me" lead-time field (in days) — defaults to 0 (shown on Reminders page, due-soon only on the day itself); clear it to null to exclude an event from the Reminders page entirely (e.g. a trip)
- Month/week/day calendar views

### 2. Reminders (read-only view of the calendar)
- Lists events that have a lead-time value set and whose start date/time is now or in the future — past events never appear
- Sorted ascending by start date
- Events within their lead-time window are visually distinct ("due soon")
- No separate add/edit form — reminders are created and edited via the normal event form on the Calendar

### 3. Recipes
- Add/edit/delete recipes via a structured template
- Fields: title, description, image, servings, prep/cook time, ingredients list, method steps, tags
- Browse/search recipe collection

### 4. Access & sharing
- Two user accounts (you + Nick), shared household — both see and can edit everything, no permission levels
- Responsive web app — works on phone, tablet, laptop from one deployment
- Installable to home screen (PWA-style), always-online (no offline sync)

## Explicitly out of scope for v1.0
- Email/push notifications (data model will support adding this later without rework)
- Document/photo attachments on reminders
- Meal planning / shopping lists
- Offline editing with sync
- Budget or spend tracking
- Contacts list

## Stack
- Next.js on Vercel (hosting + app)
- Neon Postgres (data)
- Auth.js for the two user logins
- FullCalendar (or similar) for the colour-coded calendar UI

## Definition of done for v1.0
Two users can log in, each independently add/edit calendar events (including reminder-style ones with a lead time), see them colour-coded on the calendar and reflected on the Reminders view, manage recipes, and see a shared, up-to-date view of all of it across any device — with no email sending required to consider v1.0 complete.

## Added after v1.0

### Watchlist (added 2026-07)
A TV/movie tracking page, table/row-based rather than card-based like the other pages.
- Fields per entry: Name, Source (managed dropdown list), Season, Episode, Status (To Watch / Watching / Watched), Last Updated (automatic)
- Editable via popup/dialog per row, same pattern as Calendar events
- Sortable columns, filterable (by Status and Source)
- Sources are user-manageable (add/edit/remove), same pattern as Event Types
- Shared, no permission levels — same as everything else in the app
