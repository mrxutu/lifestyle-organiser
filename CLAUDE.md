# CLAUDE.md

This file gives Claude Code persistent context for this project. Read it at the start of every session and follow it consistently.

## Project

A shared lifestyle organiser web app for two users (household of two). v1.0 covers three features only:
1. Reminders (recurring renewals/bills, e.g. car/house insurance, MOT)
2. Colour-coded events calendar
3. Recipe storage (structured template: ingredients, method, image, tags)

Full scope is in `docs/v1_scope.md` — treat it as the source of truth for what is in and out of scope. Do not add features from the "out of scope" list (email notifications, attachments, meal planning, offline sync, budget tracking, contacts) unless explicitly asked.

## Stack — do not deviate without asking

- **Framework**: Next.js, App Router, TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui — install individual components as needed (`npx shadcn@latest add <component>`), don't hand-roll equivalents that already exist in the library
- **Database**: Postgres — local for dev, Neon for production — via Prisma ORM
- **Auth**: Auth.js (NextAuth)
- **Calendar UI**: FullCalendar (react wrapper)
- **Hosting**: Vercel

Schema lives in `prisma/schema.prisma` (already defined — extend it, don't restructure it, without discussing the change first).

## Design & UI

Full visual direction is in `docs/DESIGN.md` — treat it as the source of truth for palette, typography, layout, and component approach. Key points to always apply:
- Clean/minimal style — muted colours, generous whitespace, no heavy shadows/gradients
- Use theme colours defined in `tailwind.config.ts` (e.g. `bg-primary`, `text-foreground`) — never raw hex codes inline in components
- Event type colours come from the database (`EventType.color`), never hardcoded in components
- Mobile-first responsive layout — design for phone/tablet constraints first, then expand for laptop

## Conventions

- TypeScript everywhere, strict mode on. No `any` unless genuinely unavoidable.
- Functional React components only, no class components.
- Server Components by default; only add `"use client"` when the component needs interactivity/state.
- API logic lives in `app/api/**/route.ts` using the App Router route handler pattern.
- Keep Prisma queries in a `lib/` data-access layer (e.g. `lib/reminders.ts`, `lib/events.ts`, `lib/recipes.ts`) rather than inline in route handlers or components — keeps logic testable and consistent.
- Use Zod (or similar) to validate input on API routes before hitting the database.
- Prefer small, focused components over large multi-purpose ones.
- Run `npx prisma format` after any schema edit, and generate a migration (`npx prisma migrate dev --name <description>`) rather than editing the DB by hand.
- **API responses**: use a consistent shape across all routes — success: `{ data: ... }`, error: `{ error: { message: string, code?: string } }` with an appropriate HTTP status. Don't invent a different shape per route.
- **Loading/empty states**: every list/data view must handle zero-results gracefully (a clear empty state, not a blank or broken layout) and show a loading indicator while fetching — this applies to every feature, not just ones where it's explicitly requested.

## Decisions log

`docs/DECISIONS.md` holds a running, dated log of specific choices made along the way (e.g. constraints on a colour picker, a feature deliberately deferred). Check it if unsure whether something's already been decided, and add an entry when a new non-obvious decision is made during a session.

## Environment

- `.env` holds `DATABASE_URL` (local Postgres) and is gitignored — never commit secrets or print them in full.
- Two users only (no multi-household logic needed) — see `Household` and `User` models in the schema.
- No email sending in v1.0 — reminders/events surface via an in-app "due soon" view, not notifications. Don't build email infrastructure unless asked.

## Working style

- Confirm the plan for a feature briefly before writing large amounts of code, especially anything touching the schema or auth.
- After implementing a feature, note what was added/changed in plain terms rather than assuming it's obvious from the diff.
- If a request seems to conflict with `docs/v1_scope.md`, flag the conflict rather than silently expanding scope.