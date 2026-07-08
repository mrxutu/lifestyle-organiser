// Fixed identity -> colour mapping (not "me vs other", which would flip
// depending on who's logged in). This app is permanently scoped to Paul and
// Nick (see CLAUDE.md), so this is keyed on display name rather than id.
export type UserColorKey = 'blue' | 'pink'

export function userColorKey(name: string | null): UserColorKey {
  return name === 'Nick' ? 'pink' : 'blue'
}
