import 'server-only'

import packageMetadata from '@/package.json'

export const applicationVersion = packageMetadata.version
export const applicationVersionLabel = `Version ${applicationVersion}`
