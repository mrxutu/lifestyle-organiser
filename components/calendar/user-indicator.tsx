import { cn } from '@/lib/utils'
import { userColorKey } from '@/lib/user-colors'

const colorClass = { blue: 'bg-user-blue', pink: 'bg-user-pink' } as const

export function UserIndicator({
  attendees,
  className,
}: {
  attendees: { user: { name: string | null } }[]
  className?: string
}) {
  if (attendees.length === 0) return null

  if (attendees.length >= 2) {
    return (
      <span className={cn('relative inline-block size-2.5 shrink-0 overflow-hidden rounded-[2px]', className)}>
        <span
          className="absolute inset-0 bg-user-blue"
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
        <span
          className="absolute inset-0 bg-user-pink"
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
        />
      </span>
    )
  }

  const color = userColorKey(attendees[0].user.name)
  return <span className={cn('size-2.5 shrink-0 rounded-[2px]', colorClass[color], className)} />
}
