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
  return prisma.book.create({
    data: { ...input, householdId },
    include: {
      source: true,
      reader: { select: { id: true, name: true } },
    },
  })
}

export async function updateBook(householdId: string, bookId: string, input: BookInput) {
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

export async function listBookSources() {
  return prisma.bookSource.findMany({ orderBy: { name: 'asc' } })
}

export const bookSourceInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
})

export type BookSourceInput = z.infer<typeof bookSourceInputSchema>

export async function createBookSource(input: BookSourceInput) {
  return prisma.bookSource.create({ data: input })
}

export async function updateBookSource(sourceId: string, input: BookSourceInput) {
  return prisma.bookSource.update({ where: { id: sourceId }, data: input })
}

export class BookSourceInUseError extends Error {
  constructor(public count: number) {
    super(`This source is used by ${count} book${count === 1 ? '' : 's'} and can't be deleted`)
    this.name = 'BookSourceInUseError'
  }
}

export async function deleteBookSource(sourceId: string) {
  const usageCount = await prisma.book.count({ where: { sourceId } })
  if (usageCount > 0) throw new BookSourceInUseError(usageCount)
  return prisma.bookSource.delete({ where: { id: sourceId } })
}
