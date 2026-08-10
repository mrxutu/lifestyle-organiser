# UI and Design Conventions

## Purpose

This document records durable visual and interaction conventions. Exact theme values live in `app/globals.css`, and the allowed event-type swatches live in `lib/event-type-colors.ts`.

## Visual direction

- Keep the interface clean, minimal and spacious.
- Use a neutral base palette and reserve restrained colour for meaning, status and actions.
- Avoid heavy shadows, gradients and decorative visual noise.
- Use semantic theme utilities such as `bg-background` and `text-foreground`; do not copy raw theme colours into feature components.
- Use one sans-serif family and a restrained type scale.

The authenticated app shell uses a deliberately faint, code-generated dot pattern. Authentication pages remain plain.

## Components and layout

- Use the existing shadcn/ui and shared application components before creating new primitives.
- Add shadcn components individually when a genuine new primitive is needed.
- Preserve the established top-navigation shell; feature links become icon-first at constrained widths.
- Design mobile-first, then expand within the existing centered content width.
- Prefer generous cards and list rows over dense tables unless the data genuinely requires a table.
- Use `ResponsiveDialog` for flows that should be a dialog on larger screens and a sheet on mobile.
- Wrap authenticated page content in the shared `Page` component. It owns only the standard `flex flex-col gap-6` page rhythm; the authenticated app shell continues to own width, viewport padding, background and navigation.
- Keep standard page headings, optional introductory text and primary actions consistent through `PageHeader`. Use one page-level `h1`, place the primary action last in the header action group and add a description only when it genuinely helps users understand the page.
- Preserve bespoke detail or aggregate layouts when their content relationships require it rather than forcing them through `PageHeader`.
- Group feature-local filters and results with `gap-4` unless that feature has a clearer established hierarchy.
- Use a substantial `EmptyState` when a collection has no records and a concise inline message when records exist but filters match none. Calendar is intentionally lighter: its no-events message is inline so the empty calendar remains usable.
- New feature pages, including the To-do page, should use `Page`, a standard `PageHeader` with the primary action, the established empty-state distinction and no page-level width override.
- Provide shape-appropriate loading skeletons for substantial route content.

## Themes

Light and dark modes are the same design language, not separate visual systems. Theme selection defaults to the operating-system preference and can be overridden with the persisted navigation toggle.

Theme tokens and the Tailwind 4 class-based dark-mode variant are defined in `app/globals.css`. Update both light and dark values when adding a semantic colour.

## Functional colour

Event types use the constrained muted palette in `lib/event-type-colors.ts`. The selected value is stored on the household-owned `EventType` record and rendered from the database. Additions should remain similar in saturation and must preserve readable foreground contrast.

Ratings, warnings, destructive actions, badges and active states should use existing semantic components and tokens rather than feature-specific colours.

## Interaction and responsiveness

- Controls must remain usable without horizontal page overflow down to supported phone widths.
- Icon-only controls require accessible labels and practical touch targets.
- Hiding navigation or controls is not an authorisation mechanism; server-side guards remain authoritative.
- Forms should state validation requirements before submission where practical and display server errors without exposing sensitive details.
- Assignment selectors must work for arbitrary household sizes rather than assuming two named users.
