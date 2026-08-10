import assert from 'node:assert/strict'
import test from 'node:test'
import { createBook } from '../../../lib/books'
import { prisma } from '../../../lib/prisma'
import { DatabaseFixture } from '../../fixtures/database'

test('Book creation rejects a reader from another household', async () => {
  const fixture = new DatabaseFixture()

  try {
    const householdA = await fixture.createHousehold('household-a')
    const householdB = await fixture.createHousehold('household-b')
    const foreignReader = await fixture.createUser(householdB.id, 'foreign-reader')
    const source = await prisma.bookSource.create({
      data: { name: `${fixture.prefix}-source`, householdId: householdA.id },
    })

    await assert.rejects(
      createBook(householdA.id, {
        title: 'Cross-household reader regression',
        author: 'Test Author',
        summary: null,
        dateRead: null,
        rating: null,
        status: 'TO_READ',
        sourceId: source.id,
        notes: null,
        readerId: foreignReader.id,
      }, null),
      /reader.*household/i,
    )

    assert.equal(
      await prisma.book.count({ where: { householdId: householdA.id, readerId: foreignReader.id } }),
      0,
    )
  } finally {
    await prisma.book.deleteMany({ where: { title: 'Cross-household reader regression' } })
    await fixture.cleanup()
  }
})
