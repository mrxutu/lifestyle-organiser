export const ALL_EVENT_TYPES = 'ALL'
export type UserFilterValue = 'ALL' | 'ME' | 'OTHER'

type FilterableEvent = {
  eventTypeId: string
  attendees: { userId: string }[]
}

export function filterEventsByTypeAndUser<T extends FilterableEvent>(
  events: T[],
  {
    eventTypeId,
    userFilter,
    currentUserId,
    otherUserId,
  }: {
    eventTypeId: string
    userFilter: UserFilterValue
    currentUserId: string
    otherUserId: string
  }
): T[] {
  const targetUserId = userFilter === 'ME' ? currentUserId : userFilter === 'OTHER' ? otherUserId : null

  return events.filter((event) => {
    if (eventTypeId !== ALL_EVENT_TYPES && event.eventTypeId !== eventTypeId) return false
    if (targetUserId && !event.attendees.some((a) => a.userId === targetUserId)) return false
    return true
  })
}
