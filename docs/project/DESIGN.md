# DESIGN.md

Visual and UI direction for the Lifestyle Organiser. Read alongside CLAUDE.md. Apply consistently across all features rather than deciding per-component.

## Style direction
Clean, minimal. Lots of whitespace, muted/neutral base palette, restrained use of colour reserved for meaning (event types, status) rather than decoration. Avoid heavy shadows, gradients, or busy backgrounds — let content and spacing do the work.

## Component library
**shadcn/ui** — install components individually as needed (`npx shadcn@latest add button`, etc.) rather than pulling in the whole library up front. Theme via CSS variables (shadcn's default approach), not by overriding component internals.

## Colour system

### Base palette (neutral UI)
- Background: near-white / very light grey (`#FAFAFA` / `#F5F5F5`)
- Text: dark grey/near-black (`#1A1A1A`) rather than pure black — softer, still minimal
- Borders/dividers: light grey (`#E5E5E5`)
- Primary accent (buttons, links, active states): a single muted accent colour — suggest a muted slate blue (`#4A6C8C` range) as a starting point, easy to swap in `tailwind.config.ts` later

### Dark mode (added 2026-08)
Same muted, minimal ethos inverted — not a separate design language. Near-black background (`#171717`), off-white text (`#EDEDED`, not pure white — same "softer than pure black/white" principle as light mode). Every light-mode token in `app/globals.css`'s `:root` has a `.dark` equivalent: cards/popovers sit one step lighter than the page background (`#1F1F1F`) the same way light-mode cards sit one step lighter (pure white) than the page background; `primary`/`destructive`/`warning` are each lightened just enough to keep sufficient contrast as text/icon colours against the dark background (they're used both as solid button fills and as bare text/badge colours, so they can't just be reused unchanged from light mode).

**Theme switching**: `next-themes`, `attribute="class"`, `defaultTheme="system"` + `enableSystem` — defaults to the device's OS preference, manual toggle (sun/moon icon button in the top nav) overrides and persists via `localStorage`. Tailwind v4 needed an explicit `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` to make its `dark:` variant follow the `.dark` class next-themes toggles, rather than the raw `prefers-color-scheme` media query it follows by default.

### Background pattern (added 2026-08)
A very low-opacity (5% light / 6% dark) tiled dot grid sits behind the main app shell (`.app-pattern-bg` in `app/globals.css`, applied in `app/(app)/layout.tsx`) — texture, not decoration, similar spirit to a chat app's background pattern. Code-generated (an inline SVG data URI per theme via the `--pattern-dot` CSS variable, swapped the same way as the colour tokens), not a stored image asset. Deliberately erred toward too faint rather than too visible — a single small circle (`r="1"` in a `20×20` tile) at very low `fill-opacity`, colour matching each theme's foreground tone.

### Event type colours (functional, not decorative)
Since event colour-coding is a named v1.0 feature, these need to be distinct enough to tell apart at a glance but still muted to match the overall style — avoid saturated primary colours:
- Weekend Away: muted teal `#5B8A8A`
- Appointments: muted blue `#5B7A99`
- Birthdays/Celebrations: muted rose `#B87A8C`
- Household/Bills-related events: muted amber `#B8935B`
- (Add more as categories are created — keep each new colour at similar muted saturation so none dominates the calendar visually)

Store these as the `EventType.color` values in the database (already in the schema) — don't hardcode them in components.

## Typography
- One typeface family, system font stack or a single clean sans-serif (e.g. Inter) — avoid mixing fonts
- Restrained size scale: don't need more than 4-5 heading/body sizes for an app this size

## Layout conventions
- Consistent page shell: sidebar or top nav (pick one — recommend simple top nav given only 3 sections: Reminders / Calendar / Recipes) + content area with consistent max-width and padding
- Cards/list rows with generous padding over dense tables — matches the minimal direction and works better on mobile/tablet
- Mobile-first responsive: since phone/tablet access matters, design the constrained layout first, expand for laptop rather than the reverse

## Where this lives in code
- Base palette + accent colours: `tailwind.config.ts` theme extension, referenced as named colours (e.g. `bg-background`, `text-foreground`, `bg-primary`) — never raw hex codes in components
- Event type colours: pulled from the database at render time, not hardcoded
- Keep this file updated if the palette or component approach changes — CLAUDE.md should reference it so Claude Code applies it consistently across sessions