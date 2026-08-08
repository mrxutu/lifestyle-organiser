'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { BookSource } from '@/generated/prisma/client'
import type { BookStatus } from '@/generated/prisma/enums'
import { bookStatusLabel } from '@/lib/book-status'
import { RATINGS, ratingLabel } from '@/lib/rating'
import type { BookWithDetail } from '@/lib/books'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const NO_RATING = 'NONE'

function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

export function BookForm({
  initialBook,
  sources,
  householdUsers,
  currentUserId,
}: {
  initialBook?: BookWithDetail | null
  sources: BookSource[]
  householdUsers: { id: string; name: string | null }[]
  currentUserId: string
}) {
  const router = useRouter()

  const [title, setTitle] = useState(initialBook?.title ?? '')
  const [author, setAuthor] = useState(initialBook?.author ?? '')
  const [summary, setSummary] = useState(initialBook?.summary ?? '')
  const [imageUrl, setImageUrl] = useState(initialBook?.imageUrl ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageAction, setImageAction] = useState<'keep' | 'remove' | 'replace'>('keep')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dateRead, setDateRead] = useState(toDateInputValue(initialBook?.dateRead))
  const [status, setStatus] = useState<BookStatus>(initialBook?.status ?? 'TO_READ')
  const [rating, setRating] = useState<string>(
    initialBook?.rating != null ? String(initialBook.rating) : NO_RATING
  )
  const [sourceId, setSourceId] = useState(initialBook?.sourceId ?? sources[0]?.id ?? '')
  const [notes, setNotes] = useState(initialBook?.notes ?? '')
  const [readerId, setReaderId] = useState(initialBook?.readerId ?? currentUserId)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
    setImageFile(file)
    setImageAction('replace')
    setImageUrl(URL.createObjectURL(file))
    event.target.value = ''
  }

  function removeImage() {
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
    setImageFile(null)
    setImageAction('remove')
    setImageUrl(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      title,
      author,
      summary: summary || null,
      dateRead: dateRead || null,
      rating: rating === NO_RATING ? null : Number(rating),
      status,
      sourceId,
      notes: notes || null,
      readerId,
    }

    const formData = new FormData()
    formData.append('data', JSON.stringify(body))
    if (imageFile) formData.append('image', imageFile)
    if (initialBook) formData.append('imageAction', imageAction)

    const res = await fetch(initialBook ? `/api/books/${initialBook.id}` : '/api/books', {
      method: initialBook ? 'PATCH' : 'POST',
      body: formData,
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }

    router.push('/books')
    router.refresh()
  }

  async function handleDelete() {
    if (!initialBook) return
    setDeleting(true)
    setError(null)

    const res = await fetch(`/api/books/${initialBook.id}`, { method: 'DELETE' })

    setDeleting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }

    router.push('/books')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-1.5">
        <Label htmlFor="book-title">Title</Label>
        <Input id="book-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="book-author">Author</Label>
        <Input id="book-author" required value={author} onChange={(e) => setAuthor(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="book-summary">Summary (optional)</Label>
        <Textarea id="book-summary" value={summary ?? ''} onChange={(e) => setSummary(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Cover image (optional)</Label>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
              No image
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {imageUrl ? (
                'Replace image'
              ) : (
                'Upload image'
              )}
            </Button>
            {imageUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                Remove image
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="book-status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as BookStatus)}>
            <SelectTrigger id="book-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(bookStatusLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="book-rating">Rating (optional)</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger id="book-rating" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_RATING}>No rating</SelectItem>
              {RATINGS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {ratingLabel[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="book-date-read">Date read (optional)</Label>
          <Input
            id="book-date-read"
            type="date"
            value={dateRead}
            onChange={(e) => setDateRead(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="book-source">Source</Label>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sources yet — create one under &ldquo;Manage sources&rdquo; first.
          </p>
        ) : (
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger id="book-source" className="w-full">
              <SelectValue placeholder="Select a source" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="book-reader">Reader</Label>
        <Select value={readerId} onValueChange={setReaderId}>
          <SelectTrigger id="book-reader" className="w-full">
            <SelectValue placeholder="Select a reader" />
          </SelectTrigger>
          <SelectContent>
            {householdUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name ?? user.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="book-notes">Notes (optional)</Label>
        <Textarea id="book-notes" value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialBook && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleting} className="sm:mr-auto">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this book?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{initialBook.title}&rdquo; will be removed. This can&rsquo;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button type="button" variant="outline" onClick={() => router.push('/books')}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || sources.length === 0}>
          {submitting ? 'Saving…' : initialBook ? 'Save changes' : 'Add book'}
        </Button>
      </div>
    </form>
  )
}
