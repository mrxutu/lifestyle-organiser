import { Star } from 'lucide-react'
import { RATINGS, type Rating } from '@/lib/rating'
import { cn } from '@/lib/utils'

export function StarRating({ rating }: { rating: Rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {RATINGS.map((star) => (
        <Star
          key={star}
          className={cn(
            'size-3.5',
            star <= rating ? 'fill-primary text-primary' : 'fill-none text-muted-foreground'
          )}
        />
      ))}
    </div>
  )
}
