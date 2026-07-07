# Lifestyle Organiser — v1.0 Scope

## Purpose
A shared web app for a household of two (you + Nick) to manage renewal reminders, a colour-coded events calendar, and a recipe collection — accessible from phone, tablet, and laptop.

## In scope for v1.0

### 1. Reminders
- Add/edit/delete reminders (e.g. Car Insurance, House Insurance, MOT, subscriptions)
- Category field per reminder
- Recurrence: none / monthly / quarterly / yearly
- Configurable lead time (e.g. notify 7 days before due)
- Notes field
- "Due soon" view on the dashboard (in-app, not email)

### 2. Events calendar
- Add/edit/delete events (weekends away, appointments, etc.)
- Event type/category with an assigned colour, calendar renders colour-coded
- Start/end date-time, all-day option, location field
- Month/week/day calendar views

### 3. Recipes
- Add/edit/delete recipes via a structured template
- Fields: title, description, image, servings, prep/cook time, ingredients list, method steps, tags
- Browse/search recipe collection

### 4. Access & sharing
- Two user accounts (you + Nick), shared household — both see the same reminders, calendar, and recipes
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
Two users can log in, each independently add/edit reminders, events, and recipes, and see a shared, up-to-date view of all three across any device — with no email sending required to consider v1.0 complete.
