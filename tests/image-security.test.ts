import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import { bookInputSchema } from '../lib/books'
import { recipeInputSchema } from '../lib/recipes'
import { createWithImage, deleteWithImage, updateWithImage } from '../lib/image-mutations'
import {
  InvalidImageError,
  MAX_IMAGE_BYTES,
  cleanupManagedImage,
  isManagedImageUrl,
  managedImagePathname,
  processImage,
} from '../lib/image-storage'

async function imageFile(format: 'jpeg' | 'png' | 'webp') {
  const data = await sharp({
    create: { width: 4, height: 3, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0.5 } },
  })
    .toFormat(format)
    .toBuffer()
  return new File([data], `untrusted.${format}`, { type: 'application/octet-stream' })
}

for (const format of ['jpeg', 'png', 'webp'] as const) {
  test(`decodes and re-encodes valid ${format} content without trusting the declared MIME type`, async () => {
    const result = await processImage(await imageFile(format))
    const metadata = await sharp(result.data).metadata()
    assert.equal(metadata.format, format)
    assert.equal(result.contentType, format === 'jpeg' ? 'image/jpeg' : `image/${format}`)
  })
}

test('rejects non-image content labelled as an image', async () => {
  const file = new File(['not an image'], 'attack.png', { type: 'image/png' })
  await assert.rejects(processImage(file), InvalidImageError)
})

test('rejects SVG and GIF input', async () => {
  const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>'], 'x.svg', {
    type: 'image/svg+xml',
  })
  const gif = new File([Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')], 'x.gif', {
    type: 'image/gif',
  })
  await assert.rejects(processImage(svg), InvalidImageError)
  await assert.rejects(processImage(gif), InvalidImageError)
})

test('rejects empty and over-8MB inputs before processing', async () => {
  await assert.rejects(processImage(new File([], 'empty.png')), /empty/)
  await assert.rejects(processImage(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'large.png')), /under 8MB/)
})

test('rejects excessive dimensions', async () => {
  const data = await sharp({ create: { width: 8001, height: 1, channels: 3, background: 'white' } }).png().toBuffer()
  await assert.rejects(processImage(new File([data], 'wide.png')), /dimensions/)
})

test('generates pathnames without the original filename', () => {
  const pathname = managedImagePathname('recipes', 'jpg')
  assert.match(pathname, /^lifestyle-organiser\/recipes\/[0-9a-f-]+\.jpg$/)
  assert.doesNotMatch(pathname, /untrusted/)
})

test('only recognises HTTPS Vercel Blob URLs under the expected feature prefix', () => {
  assert.equal(
    isManagedImageUrl(
      'https://store.public.blob.vercel-storage.com/lifestyle-organiser/recipes/id.jpg',
      'recipes'
    ),
    true
  )
  assert.equal(isManagedImageUrl('https://store.public.blob.vercel-storage.com/recipes/legacy.jpg', 'recipes'), true)
  assert.equal(
    isManagedImageUrl('https://store.public.blob.vercel-storage.com/lifestyle-organiser/books/id.jpg', 'recipes'),
    false
  )
  assert.equal(isManagedImageUrl('https://example.com/lifestyle-organiser/recipes/id.jpg', 'recipes'), false)
  assert.equal(isManagedImageUrl('http://store.public.blob.vercel-storage.com/recipes/id.jpg', 'recipes'), false)
})

test('Recipe and Book input schemas reject client-supplied image URLs', () => {
  const recipe = recipeInputSchema.safeParse({
    title: 'Recipe',
    chefId: 'user',
    imageUrl: 'https://store.public.blob.vercel-storage.com/recipes/other.jpg',
  })
  const book = bookInputSchema.safeParse({
    title: 'Book',
    author: 'Author',
    sourceId: 'source',
    readerId: 'reader',
    imageUrl: 'https://store.public.blob.vercel-storage.com/books/other.jpg',
  })
  assert.equal(recipe.success, false)
  assert.equal(book.success, false)
})

test('cleanup ignores arbitrary URLs and does not call Blob deletion', async () => {
  let deleteCalls = 0
  await cleanupManagedImage('recipes', 'https://example.com/recipes/id.jpg', 'test', async () => {
    deleteCalls += 1
    return true
  })
  assert.equal(deleteCalls, 0)
})

test('cleanup failure after a database mutation is logged and not rethrown', async () => {
  const originalError = console.error
  const logged: unknown[][] = []
  console.error = (...values) => logged.push(values)
  try {
    await assert.doesNotReject(
      cleanupManagedImage(
        'recipes',
        'https://store.public.blob.vercel-storage.com/lifestyle-organiser/recipes/id.jpg',
        'test update',
        async () => {
          throw new Error('Blob unavailable')
        }
      )
    )
  } finally {
    console.error = originalError
  }
  assert.equal(logged.length, 1)
  assert.match(String(logged[0][0]), /Blob cleanup failed after successful test update/)
})

function mutationServices(events: string[], cleanupError = false) {
  return {
    upload: async () => {
      events.push('upload')
      return 'https://store.public.blob.vercel-storage.com/lifestyle-organiser/recipes/new.jpg'
    },
    cleanup: async (_feature: 'recipes' | 'books', url: string | null | undefined, context: string) => {
      events.push(`cleanup:${url}:${context}`)
      if (cleanupError) return
    },
  }
}

test('create without an image performs no storage operation', async () => {
  const events: string[] = []
  const result = await createWithImage({
    feature: 'recipes',
    create: async (url) => {
      events.push(`database:${url}`)
      return 'created'
    },
    services: mutationServices(events),
  })
  assert.equal(result, 'created')
  assert.deepEqual(events, ['database:null'])
})

test('create failure compensates a newly uploaded Blob', async () => {
  const events: string[] = []
  await assert.rejects(
    createWithImage({
      feature: 'recipes',
      file: await imageFile('jpeg'),
      create: async () => {
        events.push('database')
        throw new Error('database failed')
      },
      services: mutationServices(events),
    }),
    /database failed/
  )
  assert.deepEqual(events.map((event) => event.split(':')[0]), ['upload', 'database', 'cleanup'])
})

test('keep update preserves the existing image without storage calls', async () => {
  const events: string[] = []
  await updateWithImage({
    feature: 'recipes',
    oldUrl: 'old',
    change: { action: 'keep' },
    update: async (url) => events.push(`database:${url}`),
    services: mutationServices(events),
  })
  assert.deepEqual(events, ['database:old'])
})

test('replacement commits the new URL before cleaning the obsolete Blob', async () => {
  const events: string[] = []
  await updateWithImage({
    feature: 'recipes',
    oldUrl: 'old',
    change: { action: 'replace', file: await imageFile('jpeg') },
    update: async (url) => events.push(`database:${url}`),
    services: mutationServices(events),
  })
  assert.deepEqual(events.map((event) => event.split(':')[0]), ['upload', 'database', 'cleanup'])
  assert.match(events[2], /old:replace update/)
})

test('failed replacement keeps the old image and compensates only the new Blob', async () => {
  const events: string[] = []
  await assert.rejects(
    updateWithImage({
      feature: 'recipes',
      oldUrl: 'old',
      change: { action: 'replace', file: await imageFile('jpeg') },
      update: async () => {
        events.push('database')
        throw new Error('failed')
      },
      services: mutationServices(events),
    })
  )
  assert.equal(events.some((event) => event.includes('cleanup:old')), false)
  assert.equal(events.some((event) => event.includes('update compensation')), true)
})

test('removal clears the database reference before cleaning the old Blob', async () => {
  const events: string[] = []
  await updateWithImage({
    feature: 'books',
    oldUrl: 'old',
    change: { action: 'remove' },
    update: async (url) => events.push(`database:${url}`),
    services: mutationServices(events),
  })
  assert.deepEqual(events, ['database:null', 'cleanup:old:remove update'])
})

test('record deletion commits before Blob cleanup', async () => {
  const events: string[] = []
  await deleteWithImage({
    feature: 'books',
    oldUrl: 'old',
    remove: async () => events.push('database'),
    services: mutationServices(events),
  })
  assert.deepEqual(events, ['database', 'cleanup:old:record deletion'])
})

test('database deletion failure does not clean the Blob', async () => {
  const events: string[] = []
  await assert.rejects(
    deleteWithImage({
      feature: 'books',
      oldUrl: 'old',
      remove: async () => {
        events.push('database')
        throw new Error('failed')
      },
      services: mutationServices(events),
    })
  )
  assert.deepEqual(events, ['database'])
})
