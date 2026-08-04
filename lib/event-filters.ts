export const ALL_EVENT_TYPES = 'ALL'

type FilterableEvent = {
  eventTypeId: string
  attendees: { userId: string }[]
}

export function filterEventsByTypeAndUser<T extends FilterableEvent>(
  events: T[],
  {
    eventTypeId,
    userFilter,
  }: {
    eventTypeId: string
    userFilter: string[]
  }
): T[] {
  return events.filter((event) => {
    if (eventTypeId !== ALL_EVENT_TYPES && event.eventTypeId !== eventTypeId) return false
    if (userFilter.length > 0 && !event.attendees.some((a) => userFilter.includes(a.userId))) return false
    return true
  })
}
