export type SectionKey = 'calendar' | 'recipes' | 'watchlist' | 'books'

export type SectionFlags = Record<SectionKey, boolean>

export const SECTION_KEYS: SectionKey[] = ['calendar', 'recipes', 'watchlist', 'books']

export const SECTION_META: Record<SectionKey, { label: string; route: string }> = {
  calendar: { label: 'Calendar', route: '/calendar' },
  recipes: { label: 'Recipes', route: '/recipes' },
  watchlist: { label: 'Watchlist', route: '/watchlist' },
  books: { label: 'Books', route: '/books' },
}
