import { ForbiddenError } from '@/lib/current-user'

export type LookupManager = {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  householdId: string
}

export function lookupManagementHousehold(user: LookupManager, requestedHouseholdId?: string | null) {
  if (user.role === 'MEMBER') throw new ForbiddenError('Admin access required')
  if (user.role === 'SUPER_ADMIN') return requestedHouseholdId || user.householdId
  if (requestedHouseholdId && requestedHouseholdId !== user.householdId) {
    throw new ForbiddenError("You can't manage lookup data for another household")
  }
  return user.householdId
}
