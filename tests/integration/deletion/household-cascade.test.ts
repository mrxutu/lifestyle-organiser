import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cascadeDeleteHousehold,
  HouseholdCascadeIneligibleError,
  HouseholdConfirmationError,
} from '../../../lib/admin-households'
import { prisma } from '../../../lib/prisma'
import { DatabaseFixture } from '../../fixtures/database'

async function createSuperAdmin(fixture: DatabaseFixture, householdId: string, label: string, active = true) {
  const user = await fixture.createUser(householdId, label, active)
  await prisma.user.update({ where: { id: user.id }, data: { role: 'SUPER_ADMIN' } })
  return { ...user, role: 'SUPER_ADMIN' as const, isActive: active }
}

test('cascade deletion rejects active and inactive Super Admin households without changing data', async () => {
  for (const active of [true, false]) {
    const fixture = new DatabaseFixture()
    try {
      const actorHousehold = await fixture.createHousehold(`actor-${active}`)
      const actor = await createSuperAdmin(fixture, actorHousehold.id, `actor-${active}`)
      const target = await fixture.createHousehold(`blocked-${active}`)
      const targetAdmin = await createSuperAdmin(fixture, target.id, `target-${active}`, active)

      await assert.rejects(
        cascadeDeleteHousehold(target.id, target.name, actor.id, { deleteImage: async () => true }),
        HouseholdCascadeIneligibleError
      )
      assert.equal(await prisma.household.count({ where: { id: target.id } }), 1)
      assert.equal(await prisma.user.count({ where: { id: targetAdmin.id } }), 1)
    } finally {
      await fixture.cleanup()
    }
  }
})

test('cascade deletion requires the exact current household name', async () => {
  const fixture = new DatabaseFixture()
  try {
    const actorHousehold = await fixture.createHousehold('name-actor')
    const actor = await createSuperAdmin(fixture, actorHousehold.id, 'name-actor')
    const target = await fixture.createHousehold('Case Sensitive Target')
    await fixture.createUser(target.id, 'member')

    await assert.rejects(
      cascadeDeleteHousehold(target.id, target.name.toLowerCase(), actor.id, { deleteImage: async () => true }),
      HouseholdConfirmationError
    )
    assert.equal(await prisma.household.count({ where: { id: target.id } }), 1)
    assert.equal(await prisma.user.count({ where: { householdId: target.id } }), 1)
  } finally {
    await fixture.cleanup()
  }
})

test('complete cascade removes target data, preserves global/foreign data, and safely cleans managed images', async () => {
  const fixture = new DatabaseFixture()
  const deletedImages: string[] = []
  try {
    const actorHousehold = await fixture.createHousehold('complete-actor')
    const actor = await createSuperAdmin(fixture, actorHousehold.id, 'complete-actor')
    const target = await fixture.createHousehold('complete-target')
    const member = await fixture.createUser(target.id, 'complete-member')
    const other = await fixture.createHousehold('complete-other')
    const otherMember = await fixture.createUser(other.id, 'complete-other-member')
    const eventType = await prisma.eventType.create({
      data: { householdId: target.id, name: `${fixture.prefix}-event`, color: '#3b82f6' },
    })
    const watchSource = await prisma.watchlistSource.create({
      data: { householdId: target.id, name: `${fixture.prefix}-watch` },
    })
    const bookSource = await prisma.bookSource.create({
      data: { householdId: target.id, name: `${fixture.prefix}-book` },
    })
    const otherSource = await prisma.bookSource.create({
      data: { householdId: other.id, name: `${fixture.prefix}-other-book` },
    })
    fixture.addCleanup(() => prisma.bookSource.deleteMany({ where: { id: otherSource.id } }))
    const event = await prisma.event.create({
      data: {
        householdId: target.id,
        creatorId: member.id,
        eventTypeId: eventType.id,
        title: `${fixture.prefix}-event`,
        startAt: new Date('2035-01-01T00:00:00.000Z'),
        attendees: { create: { userId: member.id } },
      },
    })
    const managedRecipe = 'https://store.public.blob.vercel-storage.com/lifestyle-organiser/recipes/shared.jpg'
    const managedBook = 'https://store.public.blob.vercel-storage.com/lifestyle-organiser/books/shared.jpg'
    const recipe = await prisma.recipe.create({
      data: {
        householdId: target.id,
        authorId: member.id,
        chefId: member.id,
        title: `${fixture.prefix}-recipe`,
        tags: [],
        imageUrl: managedRecipe,
        ingredients: { create: { name: 'Ingredient', order: 0 } },
      },
    })
    const duplicateRecipe = await prisma.recipe.create({
      data: {
        householdId: target.id,
        authorId: member.id,
        chefId: member.id,
        title: `${fixture.prefix}-duplicate-recipe`,
        tags: [],
        imageUrl: managedRecipe,
      },
    })
    const entry = await prisma.watchlistEntry.create({
      data: {
        householdId: target.id,
        sourceId: watchSource.id,
        name: `${fixture.prefix}-entry`,
        viewers: { create: { userId: member.id } },
      },
    })
    const book = await prisma.book.create({
      data: {
        householdId: target.id,
        sourceId: bookSource.id,
        readerId: member.id,
        title: `${fixture.prefix}-book`,
        author: 'Author',
        imageUrl: managedBook,
      },
    })
    const externalBook = await prisma.book.create({
      data: {
        householdId: target.id,
        sourceId: bookSource.id,
        readerId: member.id,
        title: `${fixture.prefix}-external-book`,
        author: 'Author',
        imageUrl: 'https://example.com/cover.jpg',
      },
    })
    const todo = await prisma.todo.create({
      data: { householdId: target.id, title: `${fixture.prefix}-todo`, owners: { create: { userId: member.id } } },
    })
    const token = await prisma.passwordResetToken.create({
      data: { tokenHash: `${fixture.prefix}-token`, userId: member.id, expiresAt: new Date('2035-01-01') },
    })
    const otherBook = await prisma.book.create({
      data: {
        householdId: other.id,
        sourceId: otherSource.id,
        readerId: otherMember.id,
        title: `${fixture.prefix}-other-book`,
        author: 'Other',
      },
    })
    fixture.addCleanup(() => prisma.book.deleteMany({ where: { id: otherBook.id } }))
    const limiter = await prisma.authRateLimit.create({
      data: {
        action: `${fixture.prefix}-action`,
        identifierHash: `${fixture.prefix}-identifier`,
        windowStartedAt: new Date(),
        expiresAt: new Date('2035-01-01'),
      },
    })
    fixture.addCleanup(() => prisma.authRateLimit.deleteMany({ where: { action: limiter.action } }))

    const result = await cascadeDeleteHousehold(target.id, target.name, actor.id, {
      deleteImage: async (_feature, url) => {
        assert.equal(await prisma.household.count({ where: { id: target.id } }), 0)
        deletedImages.push(url)
        return true
      },
    })

    assert.deepEqual(result.blobCleanup, { attempted: 2, failed: 0 })
    assert.deepEqual(new Set(deletedImages), new Set([managedRecipe, managedBook]))
    assert.equal(await prisma.household.count({ where: { id: target.id } }), 0)
    assert.equal(await prisma.user.count({ where: { householdId: target.id } }), 0)
    assert.equal(await prisma.eventAttendee.count({ where: { eventId: event.id } }), 0)
    assert.equal(await prisma.ingredient.count({ where: { recipeId: { in: [recipe.id, duplicateRecipe.id] } } }), 0)
    assert.equal(await prisma.watchlistViewer.count({ where: { watchlistEntryId: entry.id } }), 0)
    assert.equal(await prisma.todoOwner.count({ where: { todoId: todo.id } }), 0)
    assert.equal(await prisma.passwordResetToken.count({ where: { id: token.id } }), 0)
    assert.equal(await prisma.book.count({ where: { id: { in: [book.id, externalBook.id] } } }), 0)
    assert.equal(await prisma.book.count({ where: { id: otherBook.id } }), 1)
    assert.equal(await prisma.household.count({ where: { id: other.id } }), 1)
    assert.equal(await prisma.authRateLimit.count({ where: { action: limiter.action } }), 1)
  } finally {
    await fixture.cleanup()
  }
})

test('transaction failure rolls back all deletion and performs no Blob cleanup', async () => {
  const fixture = new DatabaseFixture()
  let blobCalls = 0
  try {
    const actorHousehold = await fixture.createHousehold('rollback-actor')
    const actor = await createSuperAdmin(fixture, actorHousehold.id, 'rollback-actor')
    const target = await fixture.createHousehold('rollback-target')
    const member = await fixture.createUser(target.id, 'rollback-member')
    const recipe = await prisma.recipe.create({
      data: {
        householdId: target.id,
        authorId: member.id,
        chefId: member.id,
        title: `${fixture.prefix}-rollback-recipe`,
        tags: [],
        imageUrl: 'https://store.public.blob.vercel-storage.com/lifestyle-organiser/recipes/rollback.jpg',
      },
    })
    fixture.addCleanup(() => prisma.recipe.deleteMany({ where: { id: recipe.id } }))

    await assert.rejects(
      cascadeDeleteHousehold(target.id, target.name, actor.id, {
        afterContentDeletion: async () => {
          throw new Error('injected transaction failure')
        },
        deleteImage: async () => {
          blobCalls += 1
          return true
        },
      }),
      /injected transaction failure/
    )
    assert.equal(await prisma.household.count({ where: { id: target.id } }), 1)
    assert.equal(await prisma.user.count({ where: { id: member.id } }), 1)
    assert.equal(await prisma.recipe.count({ where: { id: recipe.id } }), 1)
    assert.equal(blobCalls, 0)
  } finally {
    await fixture.cleanup()
  }
})

test('foreign-household references cause rollback rather than foreign assignment deletion', async () => {
  const fixture = new DatabaseFixture()
  try {
    const actorHousehold = await fixture.createHousehold('malformed-actor')
    const actor = await createSuperAdmin(fixture, actorHousehold.id, 'malformed-actor')
    const target = await fixture.createHousehold('malformed-target')
    const targetMember = await fixture.createUser(target.id, 'malformed-target-member')
    const other = await fixture.createHousehold('malformed-other')
    const otherSource = await prisma.watchlistSource.create({
      data: { householdId: other.id, name: `${fixture.prefix}-malformed-source` },
    })
    fixture.addCleanup(() => prisma.watchlistSource.deleteMany({ where: { id: otherSource.id } }))
    const foreignEntry = await prisma.watchlistEntry.create({
      data: {
        householdId: other.id,
        sourceId: otherSource.id,
        name: `${fixture.prefix}-foreign-entry`,
        viewers: { create: { userId: targetMember.id } },
      },
    })
    fixture.addCleanup(() => prisma.watchlistEntry.deleteMany({ where: { id: foreignEntry.id } }))

    await assert.rejects(cascadeDeleteHousehold(target.id, target.name, actor.id, { deleteImage: async () => true }))
    assert.equal(await prisma.household.count({ where: { id: target.id } }), 1)
    assert.equal(await prisma.user.count({ where: { id: targetMember.id } }), 1)
    assert.equal(await prisma.watchlistEntry.count({ where: { id: foreignEntry.id } }), 1)
    assert.equal(await prisma.watchlistViewer.count({ where: { watchlistEntryId: foreignEntry.id } }), 1)
  } finally {
    await fixture.cleanup()
  }
})

test('Blob cleanup failure reports successful database deletion with a warning', async () => {
  const fixture = new DatabaseFixture()
  try {
    const actorHousehold = await fixture.createHousehold('blob-failure-actor')
    const actor = await createSuperAdmin(fixture, actorHousehold.id, 'blob-failure-actor')
    const target = await fixture.createHousehold('blob-failure-target')
    const member = await fixture.createUser(target.id, 'blob-failure-member')
    await prisma.recipe.create({
      data: {
        householdId: target.id,
        authorId: member.id,
        chefId: member.id,
        title: `${fixture.prefix}-blob-failure`,
        tags: [],
        imageUrl: 'https://store.public.blob.vercel-storage.com/lifestyle-organiser/recipes/failure.jpg',
      },
    })

    const originalError = console.error
    console.error = () => undefined
    try {
      const result = await cascadeDeleteHousehold(target.id, target.name, actor.id, {
        deleteImage: async () => {
          throw new Error('Blob unavailable')
        },
      })
      assert.equal(result.databaseDeleted, true)
      assert.deepEqual(result.blobCleanup, { attempted: 1, failed: 1 })
      assert.match(result.warning ?? '', /1 managed image/)
      assert.equal(await prisma.household.count({ where: { id: target.id } }), 0)
    } finally {
      console.error = originalError
    }
  } finally {
    await fixture.cleanup()
  }
})
