# Lifestyle Organiser: Current System Overview

## Purpose

Lifestyle Organiser is a private, responsive household web application. It combines shared planning and media records with explicit household isolation, member assignments and role-based administration. It is an always-online application that can be installed as a PWA.

This document is the concise source for current product capabilities and high-level architecture. Code, configuration, the Prisma schema and migrations remain authoritative for executable detail.

## Current capabilities

### Calendar and reminders

- Household events support types with constrained colours, dates and times, all-day events, location, recurrence and one or more attendee assignments.
- Calendar views support event-type and attendee filtering.
- Reminders are not a separate data model. They are upcoming events with `leadTimeDays` set and are shown in a read-only, urgency-aware view.

### Recipes

- Household recipes support descriptions, servings, preparation and cooking times, tags, ingredients, free-form method text and an optional image.
- Every recipe has an assigned chef; the author is retained separately as creation provenance.
- Lists support title search and chef filtering.

### Watchlist

- Household watchlist entries track source, season, episode, status, optional rating and one or more assigned viewers.
- The card-based list supports status, source, rating and viewer filters.

### Books

- Household books track title, author, summary, source, reading status, date read, notes, optional rating, optional cover image and one assigned reader.
- Books have list, detail, create and edit routes with title, rating and reader filtering.

### Profile

- Profile is an assignment-based summary of the signed-in member’s reminders, recipes, watchlist entries and books.
- It does not currently provide self-service name or password editing.

### Accounts and administration

- Auth.js credentials authentication uses database-backed users and JWT sessions whose version is revalidated against PostgreSQL.
- Password setup and reset use single-use, expiring links delivered through Resend when email is configured.
- Authentication attempts are rate-limited in PostgreSQL; reset tokens and limiter identifiers are stored as hashes.
- Users can be active or inactive and have one of three roles: `SUPER_ADMIN`, `ADMIN` or `MEMBER`.
- Super Admins manage households and users across the application. Admins manage members and lookup data within their own household. Members use enabled household features.
- Super Admins can enable or disable Calendar/Reminders, Recipes, Watchlist and Books for a whole household. Page and API access are both enforced server-side.

### Household-owned data

Events, recipes, watchlist entries, books and their configurable lookup records are scoped to one household. Assignment inputs are validated against active members of the same household. Cross-household access is rejected on the server.

New households receive default Event Types, Watchlist Sources and Book Sources. Those records then belong to that household and can be managed independently.

## High-level architecture

- `app/` contains Next.js App Router pages, layouts, route handlers, authentication pages, the PWA manifest and loading boundaries.
- `components/` contains feature UI and shared shadcn-based primitives.
- `lib/` contains domain validation, household-scoped data access, authorisation, filters, authentication helpers, image processing and external-service adapters.
- `proxy.ts` protects authenticated routes while allowing the login and password-reset flow.
- `prisma/schema.prisma` defines the PostgreSQL model; `prisma/migrations/` is the ordered database history; `generated/prisma/` is the tracked generated client.
- Vercel hosts the Next.js application, Neon hosts PostgreSQL, Resend sends account email, and Vercel Blob stores managed recipe and book images.

## Security boundaries

The application applies several independent controls:

- authentication establishes the current user;
- role checks control administrative operations;
- household IDs scope domain reads and writes;
- section guards protect both pages and APIs;
- assignment and lookup validation rejects records outside the active household;
- image uploads are decoded, validated and re-encoded before storage.

Client-side navigation and controls improve usability but are not treated as security boundaries.

## Authoritative references

- Developer setup and environment: `README.md`
- Operational rules: `AGENTS.md` and `docs/operational/`
- Current UI conventions: `docs/project/DESIGN.md`
- Historical decisions: `docs/project/DECISIONS.md`
- Active and future work: `docs/project/BACKLOG.md`
- Database model: `prisma/schema.prisma` and `prisma/migrations/`
- Exact commands: `package.json`
