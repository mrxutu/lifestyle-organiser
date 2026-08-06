export const ALL_MEMBERS = 'ALL'

export function memberFilterLabel(
  user: { id: string; name: string | null },
  currentUserId: string
) {
  return user.id === currentUserId ? 'Me' : (user.name ?? 'Unnamed household member')
}
