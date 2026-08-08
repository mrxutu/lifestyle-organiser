import { del, put } from '@vercel/blob'
import sharp from 'sharp'

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 8_000
export const MAX_IMAGE_PIXELS = 40_000_000

export type ImageFeature = 'recipes' | 'books'

const OUTPUT_TYPES = {
  jpeg: { extension: 'jpg', contentType: 'image/jpeg' },
  png: { extension: 'png', contentType: 'image/png' },
  webp: { extension: 'webp', contentType: 'image/webp' },
} as const

type SupportedFormat = keyof typeof OUTPUT_TYPES

export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidImageError'
  }
}

export function managedImagePathname(feature: ImageFeature, extension: string) {
  return `lifestyle-organiser/${feature}/${crypto.randomUUID()}.${extension}`
}

export function isManagedImageUrl(value: string, feature: ImageFeature) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.blob.vercel-storage.com')) return false

    const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    return (
      pathname.startsWith(`lifestyle-organiser/${feature}/`) ||
      // Images uploaded before the security refactor used this feature-only prefix.
      pathname.startsWith(`${feature}/`)
    )
  } catch {
    return false
  }
}

export async function processImage(file: File) {
  if (file.size === 0) throw new InvalidImageError('Image file is empty')
  if (file.size > MAX_IMAGE_BYTES) throw new InvalidImageError('Image must be under 8MB')

  const input = Buffer.from(await file.arrayBuffer())

  try {
    const image = sharp(input, { animated: true, limitInputPixels: MAX_IMAGE_PIXELS })
    const metadata = await image.metadata()
    const format = metadata.format as SupportedFormat | undefined

    if (!format || !(format in OUTPUT_TYPES)) {
      throw new InvalidImageError('Image must be a JPEG, PNG, or WebP file')
    }
    if ((metadata.pages ?? 1) > 1) {
      throw new InvalidImageError('Animated images are not supported')
    }
    if (!metadata.width || !metadata.height) {
      throw new InvalidImageError('Image dimensions could not be read')
    }
    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      throw new InvalidImageError(`Image dimensions must not exceed ${MAX_IMAGE_DIMENSION}×${MAX_IMAGE_DIMENSION}px`)
    }
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      throw new InvalidImageError(`Image must not exceed ${MAX_IMAGE_PIXELS.toLocaleString()} total pixels`)
    }

    const normalised = image.autoOrient()
    const data =
      format === 'jpeg'
        ? await normalised.jpeg({ quality: 85 }).toBuffer()
        : format === 'png'
          ? await normalised.png().toBuffer()
          : await normalised.webp({ quality: 85 }).toBuffer()

    return { data, ...OUTPUT_TYPES[format] }
  } catch (error) {
    if (error instanceof InvalidImageError) throw error
    throw new InvalidImageError('File contents are not a valid supported image')
  }
}

export async function uploadManagedImage(feature: ImageFeature, file: File) {
  const image = await processImage(file)
  const blob = await put(managedImagePathname(feature, image.extension), image.data, {
    access: 'public',
    contentType: image.contentType,
  })
  return blob.url
}

export async function deleteManagedImage(feature: ImageFeature, url: string) {
  if (!isManagedImageUrl(url, feature)) return false
  await del(url)
  return true
}

export async function cleanupManagedImage(
  feature: ImageFeature,
  url: string | null | undefined,
  context: string,
  deleteImage: typeof deleteManagedImage = deleteManagedImage
) {
  if (!url || !isManagedImageUrl(url, feature)) return
  try {
    await deleteImage(feature, url)
  } catch (error) {
    console.error(`Blob cleanup failed after successful ${context}`, { feature, url, error })
  }
}

export const imageServices = {
  upload: uploadManagedImage,
  cleanup: cleanupManagedImage,
}
