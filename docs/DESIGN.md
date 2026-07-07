# DESIGN.md

Visual and UI direction for the Lifestyle Organiser. Read alongside CLAUDE.md. Apply consistently across all features rather than deciding per-component.

## Style direction
Clean, minimal. Lots of whitespace, muted/neutral base palette, restrained use of colour reserved for meaning (event types, status) rather than decoration. Avoid heavy shadows, gradients, or busy backgrounds — let content and spacing do the work.

## Component library
**shadcn/ui** — install components individually as needed (`npx shadcn@latest add button`, etc.) rather than pulling in the whole library up front. Theme via CSS variables (shadcn's default approach), not by overriding component internals.

## Colour system

### Base palette (neutral UI)
- Background: near-white / very light grey (`#FAFAFA` / `#F5F5F5`), dark mode equivalent near-black later if added
- Text: dark grey/near-black (`#1A1A1A`) rather than pure black — softer, still minimal
- Borders/dividers: light grey (`#E5E5E5`)
- Primary accent (buttons, links, active states): a single muted accent colour — suggest a muted slate blue (`#4A6C8C` range) as a starting point, easy to swap in `tailwind.config.ts` later

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