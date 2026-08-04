import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/star-rating'
import { bookStatusBadgeVariant, bookStatusLabel } from '@/lib/book-status'
import type { Rating } from '@/lib/rating'
import type { listBooks } from '@/lib/books'

export function BookCard({ book }: { book: Awaited<ReturnType<typeof listBooks>>[number] }) {
  return (
    <Link href={`/books/${book.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex gap-4">
          {book.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.imageUrl}
              alt=""
              className="h-20 w-14 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-md bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <p className="font-medium">{book.title}</p>
            <p className="text-sm text-muted-foreground">{book.author}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={bookStatusBadgeVariant[book.status]}>{bookStatusLabel[book.status]}</Badge>
              {book.reader.name && <Badge variant="outline">{book.reader.name}</Badge>}
              {book.rating && <StarRating rating={book.rating as Rating} />}
            </div>
            {book.summary && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{book.summary}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
