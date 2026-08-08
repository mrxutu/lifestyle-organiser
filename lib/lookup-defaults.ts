import type { Prisma } from '@/generated/prisma/client'

export const HOUSEHOLD_LOOKUP_DEFAULTS = {
  eventTypes: [
    { name: 'Appointment', color: '#5B7A99' },
    { name: 'Reminder', color: '#B8935B' },
    { name: 'Renewal', color: '#5B8A8A' },
  ],
  watchlistSources: [
    { name: 'Netflix' },
    { name: 'Apple TV' },
    { name: 'Terrestrial' },
    { name: 'Prime TV' },
  ],
  bookSources: [{ name: 'Kindle' }, { name: 'Physical Book' }],
} as const

export function householdLookupDefaults(): Pick<
  Prisma.HouseholdCreateInput,
  'eventTypes' | 'watchlistSources' | 'bookSources'
> {
  return {
    eventTypes: {
      create: HOUSEHOLD_LOOKUP_DEFAULTS.eventTypes.map((value) => ({ ...value })),
    },
    watchlistSources: {
      create: HOUSEHOLD_LOOKUP_DEFAULTS.watchlistSources.map((value) => ({ ...value })),
    },
    bookSources: {
      create: HOUSEHOLD_LOOKUP_DEFAULTS.bookSources.map((value) => ({ ...value })),
    },
  }
}
