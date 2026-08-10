import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function Page({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-6', className)} {...props} />
}
