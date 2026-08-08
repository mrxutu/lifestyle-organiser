import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { BookStatus } from '@/generated/prisma/enums'

const emptyToNull = (val: unknown) => (val === '' || val == null ? null : val)

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  author: z.string().trim().min(1, 'Author is required').max(200),
  summary: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  dateRead: z.preprocess(emptyToNull, z.coerce.date().nullable()),
  rating: z.preprocess(emptyToNull, z.coerce.number().int().min(1).max(5).nullable()),
  status: z.enum(BookStatus).default('TO_READ'),
  sourceId: z.string().min(1, 'Source is required'),
  notes: z.string().trim().max(2000).optional().nullable(),
  readerId: z.string().min(1, 'Reader is required'),
})

export type BookInput = z.infer<typeof bookInputSchema>

export class InvalidBookSourceError extends Error {
  constructor() {
    super('The selected source must belong to this household')
    this.name = 'InvalidBookSourceError'
  }
}

async function assertBookSourceInHousehold(householdId: string, sourceId: string) {
  const count = await prisma.bookSource.count({ where: { id: sourceId, householdId } })
  if (count !== 1) throw new InvalidBookSourceError()
}

export async function listBooks(householdId: string) {
  return prisma.book.findMany({
    where: { householdId },
    include: {
      source: true,
      reader: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBook(householdId: string, bookId: string) {
  return prisma.book.findFirst({
    where: { id: bookId, householdId },
    include: {
      source: true,
      reader: { select: { id: true, name: true } },
    },
  })
}

export type BookWithDetail = NonNullable<Awaited<ReturnType<typeof getBook>>>

export async function createBook(householdId: string, input: BookInput) {
  await assertBookSourceInHousehold(householdId, input.sourceId)
  return prisma.book.create({
    data: { ...input, householdId },
    include: {
      source: true,
      reader: { select: { id: true, name: true } },
    },
  })
}

export async function updateBook(householdId: string, bookId: string, input: BookInput) {
  await assertBookSourceInHousehold(householdId, input.sourceId)
  const result = await prisma.book.updateMany({ where: { id: bookId, householdId }, data: input })
  if (result.count === 0) return null

  return prisma.book.findUnique({
    where: { id: bookId },
    include: {
      source: true,
      reader: { select: { id: true, name: true } },
    },
  })
}

export async function deleteBook(householdId: string, bookId: string) {
  const result = await prisma.book.deleteMany({ where: { id: bookId, householdId } })
  return result.count > 0
}

export async function listBookSources(householdId: string) {
  return prisma.bookSource.findMany({ where: { householdId }, orderBy: { name: 'asc' } })
}

export const bookSourceInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
})

export type BookSourceInput = z.infer<typeof bookSourceInputSchema>

export async function createBookSource(householdId: string, input: BookSourceInput) {
  return prisma.bookSource.create({ data: { ...input, householdId } })
}

export async function updateBookSource(
  householdId: string,
  sourceId: string,
  input: BookSourceInput
) {
  const result = await prisma.bookSource.updateMany({
    where: { id: sourceId, householdId },
    data: input,
  })
  if (result.count === 0) return null
  return prisma.bookSource.findUnique({ where: { id: sourceId } })
}

export class BookSourceInUseError extends Error {
  constructor(public count: number) {
    super(`This source is used by ${count} book${count === 1 ? '' : 's'} and can't be deleted`)
    this.name = 'BookSourceInUseError'
  }
}

export async function deleteBookSource(householdId: string, sourceId: string) {
  const usageCount = await prisma.book.count({ where: { sourceId, householdId } })
  if (usageCount > 0) throw new BookSourceInUseError(usageCount)
  const result = await prisma.bookSource.deleteMany({ where: { id: sourceId, householdId } })
  return result.count > 0
}
