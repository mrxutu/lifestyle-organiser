import { BookStatus } from '@/generated/prisma/enums'

export const bookStatusLabel: Record<BookStatus, string> = {
  TO_READ: 'To Read',
  READING: 'Reading',
  READ: 'Read',
}

export const bookStatusBadgeVariant: Record<BookStatus, 'outline' | 'default' | 'secondary'> = {
  TO_READ: 'outline',
  READING: 'default',
  READ: 'secondary',
}
