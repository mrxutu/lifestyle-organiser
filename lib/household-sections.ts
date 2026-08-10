export type SectionKey = 'calendar' | 'todos' | 'recipes' | 'watchlist' | 'books'

export type SectionFlags = Record<SectionKey, boolean>

export const SECTION_KEYS: SectionKey[] = ['calendar', 'todos', 'recipes', 'watchlist', 'books']

export const SECTION_META: Record<SectionKey, { label: string; route: string }> = {
  calendar: { label: 'Calendar', route: '/calendar' },
  todos: { label: 'To-dos', route: '/todo' },
  recipes: { label: 'Recipes', route: '/recipes' },
  watchlist: { label: 'Watchlist', route: '/watchlist' },
  books: { label: 'Books', route: '/books' },
}
