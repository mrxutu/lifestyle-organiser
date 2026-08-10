import { randomUUID } from 'node:crypto'
import { prisma } from '../../lib/prisma'

export const TEST_RUN_ID = `automated-test-${randomUUID()}`

export class DatabaseFixture {
  readonly prefix = `${TEST_RUN_ID}-${randomUUID()}`
  readonly #cleanup: Array<() => Promise<unknown>> = []

  addCleanup(cleanup: () => Promise<unknown>) {
    this.#cleanup.push(cleanup)
  }

  async createHousehold(label: string) {
    const household = await prisma.household.create({
      data: { name: `${this.prefix}-${label}` },
    })
    this.addCleanup(() => prisma.household.deleteMany({ where: { id: household.id } }))
    return household
  }

  async createUser(householdId: string, label: string, active = true) {
    const user = await prisma.user.create({
      data: {
        email: `${this.prefix}-${label}@example.test`,
        name: `${label} test user`,
        householdId,
        isActive: active,
      },
    })
    this.addCleanup(() => prisma.user.deleteMany({ where: { id: user.id } }))
    return user
  }

  async cleanup() {
    const failures: unknown[] = []
    for (const cleanup of this.#cleanup.reverse()) {
      try {
        await cleanup()
      } catch (error) {
        failures.push(error)
      }
    }
    if (failures.length > 0) throw new AggregateError(failures, 'Database fixture cleanup failed')
  }
}
