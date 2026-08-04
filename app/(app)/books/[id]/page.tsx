import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/books/star-rating'
import { bookStatusBadgeVariant, bookStatusLabel } from '@/lib/book-status'
import type { BookRating } from '@/lib/book-rating'
import { formatFriendlyDate } from '@/lib/format-datetime'
import { getCurrentUser } from '@/lib/current-user'
import { getBook } from '@/lib/books'

export default async function BookViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { householdId } = await getCurrentUser()
  const book = await getBook(householdId, id)

  if (!book) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {book.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.imageUrl}
              alt={book.title}
              className="h-32 w-24 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{book.title}</h1>
            <p className="text-muted-foreground">{book.author}</p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/books/${book.id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={bookStatusBadgeVariant[book.status]}>{bookStatusLabel[book.status]}</Badge>
        <Badge variant="outline">{book.source.name}</Badge>
        {book.reader.name && <Badge variant="outline">{book.reader.name}</Badge>}
        {book.rating && <StarRating rating={book.rating as BookRating} />}
      </div>

      {book.dateRead && (
        <p className="text-sm text-muted-foreground">Read on {formatFriendlyDate(book.dateRead)}</p>
      )}

      {book.summary && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Summary</h2>
          <p className="whitespace-pre-line text-muted-foreground">{book.summary}</p>
        </div>
      )}

      {book.notes && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Notes</h2>
          <p className="whitespace-pre-line text-muted-foreground">{book.notes}</p>
        </div>
      )}
    </div>
  )
}
