import { z } from 'zod'
import type { ImageChange } from '@/lib/image-mutations'

export function parseJsonFormField<T>(form: FormData, schema: z.ZodType<T>) {
  const raw = form.get('data')
  if (typeof raw !== 'string') throw new z.ZodError([{ code: 'custom', path: ['data'], message: 'Form data is required' }])

  try {
    return schema.parse(JSON.parse(raw))
  } catch (error) {
    if (error instanceof z.ZodError) throw error
    throw new z.ZodError([{ code: 'custom', path: ['data'], message: 'Form data must be valid JSON' }])
  }
}

export function parseCreateImage(form: FormData) {
  const image = form.get('image')
  return image instanceof File && image.size > 0 ? image : undefined
}

export function parseImageChange(form: FormData): ImageChange {
  const action = form.get('imageAction')
  if (action === 'keep') return { action }
  if (action === 'remove') return { action }
  if (action === 'replace') {
    const image = form.get('image')
    if (!(image instanceof File) || image.size === 0) {
      throw new z.ZodError([{ code: 'custom', path: ['image'], message: 'Replacement image is required' }])
    }
    return { action, file: image }
  }
  throw new z.ZodError([{ code: 'custom', path: ['imageAction'], message: 'Invalid image action' }])
}
