import type { ImageFeature } from '@/lib/image-storage'

type ImageServices = {
  upload: (feature: ImageFeature, file: File) => Promise<string>
  cleanup: (feature: ImageFeature, url: string | null | undefined, context: string) => Promise<void>
}

export async function createWithImage<T>({
  feature,
  file,
  create,
  services,
}: {
  feature: ImageFeature
  file?: File
  create: (imageUrl: string | null) => Promise<T>
  services: ImageServices
}) {
  let newUrl: string | null = null
  try {
    if (file) newUrl = await services.upload(feature, file)
    return await create(newUrl)
  } catch (error) {
    await services.cleanup(feature, newUrl, 'create compensation')
    throw error
  }
}

export type ImageChange = { action: 'keep' } | { action: 'remove' } | { action: 'replace'; file: File }

export async function updateWithImage<T>({
  feature,
  oldUrl,
  change,
  update,
  services,
}: {
  feature: ImageFeature
  oldUrl: string | null
  change: ImageChange
  update: (imageUrl: string | null) => Promise<T>
  services: ImageServices
}) {
  if (change.action === 'keep') return update(oldUrl)

  let newUrl: string | null = null
  try {
    if (change.action === 'replace') newUrl = await services.upload(feature, change.file)
    const result = await update(newUrl)
    await services.cleanup(feature, oldUrl, `${change.action} update`)
    return result
  } catch (error) {
    await services.cleanup(feature, newUrl, 'update compensation')
    throw error
  }
}

export async function deleteWithImage<T>({
  feature,
  oldUrl,
  remove,
  services,
}: {
  feature: ImageFeature
  oldUrl: string | null
  remove: () => Promise<T>
  services: Pick<ImageServices, 'cleanup'>
}) {
  const result = await remove()
  await services.cleanup(feature, oldUrl, 'record deletion')
  return result
}
