import { WatchStatus } from '@/generated/prisma/enums'

export const watchStatusLabel: Record<WatchStatus, string> = {
  TO_WATCH: 'To Watch',
  WATCHING: 'Watching',
  WATCHED: 'Watched',
}

export const watchStatusBadgeVariant: Record<WatchStatus, 'outline' | 'default' | 'secondary'> = {
  TO_WATCH: 'outline',
  WATCHING: 'default',
  WATCHED: 'secondary',
}
