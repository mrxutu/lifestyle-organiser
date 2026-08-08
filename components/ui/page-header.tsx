import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  actions?: ReactNode
  className?: string
  titleClassName?: string
  actionsClassName?: string
  titleTag?: 'h1' | 'h2' | 'h3'
}

export function PageHeader({
  title,
  actions,
  className,
  titleClassName,
  actionsClassName,
  titleTag: TitleTag = 'h1',
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <TitleTag className={cn('text-2xl font-semibold', titleClassName)}>{title}</TitleTag>
      {actions ? <div className={cn('flex flex-wrap items-center gap-2', actionsClassName)}>{actions}</div> : null}
    </div>
  )
}
