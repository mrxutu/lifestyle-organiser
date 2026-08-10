import assert from 'node:assert/strict'
import test from 'node:test'
import { createBook, InvalidBookReaderError, updateBook, type BookInput } from '../../../lib/books'
import { prisma } from '../../../lib/prisma'
import { DatabaseFixture } from '../../fixtures/database'

const baseInput = (sourceId: string, readerId: string, title: string): BookInput => ({
  title,
  author: 'Test Author',
  summary: null,
  dateRead: null,
  rating: null,
  status: 'TO_READ',
  sourceId,
  notes: null,
  readerId,
})

async function createSource(fixture: DatabaseFixture, householdId: string) {
  const source = await prisma.bookSource.create({
    data: { name: `${fixture.prefix}-source`, householdId },
  })
  fixture.addCleanup(() => prisma.bookSource.deleteMany({ where: { id: source.id } }))
  return source
}

async function trackBook(fixture: DatabaseFixture, bookId: string) {
  fixture.addCleanup(() => prisma.book.deleteMany({ where: { id: bookId } }))
}

test('Book create and update accept an active reader from the same household', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('household')
    const firstReader = await fixture.createUser(household.id, 'first-reader')
    const secondReader = await fixture.createUser(household.id, 'second-reader')
    const source = await createSource(fixture, household.id)

    const book = await createBook(
      household.id,
      baseInput(source.id, firstReader.id, `${fixture.prefix}-accepted-reader`),
      null,
    )
    await trackBook(fixture, book.id)
    assert.equal(book.readerId, firstReader.id)

    const updated = await updateBook(
      household.id,
      book.id,
      baseInput(source.id, secondReader.id, `${fixture.prefix}-updated-reader`),
      null,
    )
    assert.equal(updated?.readerId, secondReader.id)
  } finally {
    await fixture.cleanup()
  }
})

const invalidReaders: Array<{
  label: string
  create: (fixture: DatabaseFixture, householdId: string) => Promise<{ id: string }>
}> = [
  { label: 'foreign-household', create: async (fixture: DatabaseFixture) => {
    const foreignHousehold = await fixture.createHousehold('foreign-household')
    return fixture.createUser(foreignHousehold.id, 'foreign-reader')
  } },
  { label: 'inactive', create: (fixture: DatabaseFixture, householdId: string) => (
    fixture.createUser(householdId, 'inactive-reader', false)
  ) },
]

for (const invalidReader of invalidReaders) {
  test(`Book creation rejects a ${invalidReader.label} reader and creates no record`, async () => {
    const fixture = new DatabaseFixture()

    try {
      const household = await fixture.createHousehold('household')
      const reader = await invalidReader.create(fixture, household.id)
      const source = await createSource(fixture, household.id)
      const title = `${fixture.prefix}-${invalidReader.label}-create`

      await assert.rejects(
        createBook(household.id, baseInput(source.id, reader.id, title), null),
        InvalidBookReaderError,
      )
      assert.equal(await prisma.book.count({ where: { householdId: household.id, title } }), 0)
    } finally {
      await fixture.cleanup()
    }
  })

  test(`Book update rejects a ${invalidReader.label} reader and leaves the Book unchanged`, async () => {
    const fixture = new DatabaseFixture()

    try {
      const household = await fixture.createHousehold('household')
      const originalReader = await fixture.createUser(household.id, 'original-reader')
      const reader = await invalidReader.create(fixture, household.id)
      const source = await createSource(fixture, household.id)
      const originalTitle = `${fixture.prefix}-original`
      const book = await createBook(
        household.id,
        baseInput(source.id, originalReader.id, originalTitle),
        null,
      )
      await trackBook(fixture, book.id)

      await assert.rejects(
        updateBook(
          household.id,
          book.id,
          baseInput(source.id, reader.id, `${fixture.prefix}-should-not-be-saved`),
          null,
        ),
        InvalidBookReaderError,
      )

      const unchanged = await prisma.book.findUniqueOrThrow({ where: { id: book.id } })
      assert.equal(unchanged.readerId, originalReader.id)
      assert.equal(unchanged.title, originalTitle)
    } finally {
      await fixture.cleanup()
    }
  })
}
