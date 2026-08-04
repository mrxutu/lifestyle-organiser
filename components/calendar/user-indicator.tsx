import { Badge } from '@/components/ui/badge'

export function UserIndicator({
  attendees,
  currentUserId,
  className,
}: {
  attendees: { userId: string }[]
  currentUserId: string
  className?: string
}) {
  if (attendees.length === 0) return null

  const isMe = attendees.some((a) => a.userId === currentUserId)
  const othersCount = attendees.filter((a) => a.userId !== currentUserId).length

  let label: string
  if (isMe && othersCount > 0) label = `Me + Other${othersCount === 1 ? '' : 's'}`
  else if (isMe) label = 'Me'
  else label = othersCount === 1 ? 'Other' : 'Others'

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  )
}
