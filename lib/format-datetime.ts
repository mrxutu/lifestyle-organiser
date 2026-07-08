function ordinal(day: number): string {
  const remainder100 = day % 100
  if (remainder100 >= 11 && remainder100 <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

// "Wed 8th July 2026"
export function formatFriendlyDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(date)
  return `${weekday} ${ordinal(date.getDate())} ${month} ${date.getFullYear()}`
}

// "1:15pm"
export function formatFriendlyTime(date: Date): string {
  const hours = date.getHours()
  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hour12}:${minutes}${period}`
}

// "Wed 8th July 2026 at 1:15pm" (time omitted for all-day dates)
export function formatFriendlyDateTime(date: Date, options?: { allDay?: boolean }): string {
  const datePart = formatFriendlyDate(date)
  if (options?.allDay) return datePart
  return `${datePart} at ${formatFriendlyTime(date)}`
}
