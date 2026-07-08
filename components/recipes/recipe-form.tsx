'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { MeasurementUnit } from '@/generated/prisma/enums'
import { unitLabel } from '@/lib/measurement-units'
import type { RecipeWithDetail } from '@/lib/recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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

const NO_UNIT = 'NONE'

type IngredientRow = {
  key: string
  name: string
  amount: string
  unit: MeasurementUnit | typeof NO_UNIT
  order: string
}

function newKey() {
  return crypto.randomUUID()
}

function ingredientRowsFrom(recipe?: RecipeWithDetail | null): IngredientRow[] {
  if (!recipe || recipe.ingredients.length === 0) {
    return [{ key: newKey(), name: '', amount: '', unit: NO_UNIT, order: '1' }]
  }
  return recipe.ingredients.map((i) => ({
    key: newKey(),
    name: i.name,
    amount: i.amount != null ? String(i.amount) : '',
    unit: i.unit ?? NO_UNIT,
    order: String(i.order),
  }))
}

export function RecipeForm({ initialRecipe }: { initialRecipe?: RecipeWithDetail | null }) {
  const router = useRouter()

  const [title, setTitle] = useState(initialRecipe?.title ?? '')
  const [description, setDescription] = useState(initialRecipe?.description ?? '')
  const [servings, setServings] = useState(initialRecipe?.servings != null ? String(initialRecipe.servings) : '')
  const [prepMinutes, setPrepMinutes] = useState(
    initialRecipe?.prepMinutes != null ? String(initialRecipe.prepMinutes) : ''
  )
  const [cookMinutes, setCookMinutes] = useState(
    initialRecipe?.cookMinutes != null ? String(initialRecipe.cookMinutes) : ''
  )
  const [imageUrl, setImageUrl] = useState(initialRecipe?.imageUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [tags, setTags] = useState<string[]>(initialRecipe?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')
  const [ingredients, setIngredients] = useState<IngredientRow[]>(ingredientRowsFrom(initialRecipe))
  const [method, setMethod] = useState(initialRecipe?.method ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addTag() {
    const value = tagDraft.trim()
    if (value && !tags.includes(value)) setTags([...tags, value])
    setTagDraft('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function addIngredient() {
    setIngredients([
      ...ingredients,
      { key: newKey(), name: '', amount: '', unit: NO_UNIT, order: String(ingredients.length + 1) },
    ])
  }

  function updateIngredient(key: string, patch: Partial<IngredientRow>) {
    setIngredients(ingredients.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function removeIngredient(key: string) {
    setIngredients(ingredients.filter((row) => row.key !== key))
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    setUploading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Image upload failed')
      return
    }

    const data = await res.json()
    setImageUrl(data.url)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      servings: servings || null,
      prepMinutes: prepMinutes || null,
      cookMinutes: cookMinutes || null,
      tags,
      ingredients: ingredients
        .filter((row) => row.name.trim() !== '')
        .map((row) => ({
          name: row.name,
          amount: row.amount || null,
          unit: row.unit === NO_UNIT ? null : row.unit,
          order: Number(row.order) || 0,
        })),
      method: method.trim() || null,
    }

    const res = await fetch(initialRecipe ? `/api/recipes/${initialRecipe.id}` : '/api/recipes', {
      method: initialRecipe ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }

    router.push('/recipes')
    router.refresh()
  }

  async function handleDelete() {
    if (!initialRecipe) return
    setDeleting(true)
    setError(null)

    const res = await fetch(`/api/recipes/${initialRecipe.id}`, { method: 'DELETE' })

    setDeleting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }

    router.push('/recipes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-1.5">
        <Label htmlFor="recipe-title">Title</Label>
        <Input id="recipe-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recipe-description">Description (optional)</Label>
        <Textarea
          id="recipe-description"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Photo (optional)</Label>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
              No photo
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" /> Uploading…
                </>
              ) : imageUrl ? (
                'Replace photo'
              ) : (
                'Upload photo'
              )}
            </Button>
            {imageUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl(null)}>
                Remove photo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recipe-servings">Servings</Label>
          <Input
            id="recipe-servings"
            type="number"
            min={1}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recipe-prep">Prep (min)</Label>
          <Input
            id="recipe-prep"
            type="number"
            min={0}
            value={prepMinutes}
            onChange={(e) => setPrepMinutes(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recipe-cook">Cook (min)</Label>
          <Input
            id="recipe-cook"
            type="number"
            min={0}
            value={cookMinutes}
            onChange={(e) => setCookMinutes(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recipe-tags">Tags (optional)</Label>
        <div className="flex gap-2">
          <Input
            id="recipe-tags"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Add a tag and press Enter"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Ingredients</Label>
        <div className="flex flex-col gap-2">
          {ingredients.map((row) => (
            <div key={row.key} className="grid grid-cols-12 items-center gap-2">
              <Input
                className="col-span-2"
                type="number"
                min={1}
                aria-label="Order"
                value={row.order}
                onChange={(e) => updateIngredient(row.key, { order: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                aria-label="Amount"
                value={row.amount}
                onChange={(e) => updateIngredient(row.key, { amount: e.target.value })}
              />
              <Select
                value={row.unit}
                onValueChange={(value) => updateIngredient(row.key, { unit: value as IngredientRow['unit'] })}
              >
                <SelectTrigger className="col-span-2 w-full" aria-label="Unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_UNIT}>None</SelectItem>
                  {Object.values(MeasurementUnit).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unitLabel[unit]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="col-span-5"
                placeholder="Ingredient name"
                aria-label="Ingredient name"
                value={row.name}
                onChange={(e) => updateIngredient(row.key, { name: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => removeIngredient(row.key)}
                aria-label="Remove ingredient"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
          <Plus /> Add ingredient
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recipe-method">Method (optional)</Label>
        <Textarea
          id="recipe-method"
          rows={10}
          placeholder={'1. Preheat the oven to 180°C\n2. Mix the dry ingredients\n3. ...'}
          value={method ?? ''}
          onChange={(e) => setMethod(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialRecipe && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleting} className="sm:mr-auto">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{initialRecipe.title}&rdquo; will be removed. This can&rsquo;t be undone.
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
        <Button type="button" variant="outline" onClick={() => router.push('/recipes')}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? 'Saving…' : initialRecipe ? 'Save changes' : 'Add recipe'}
        </Button>
      </div>
    </form>
  )
}
