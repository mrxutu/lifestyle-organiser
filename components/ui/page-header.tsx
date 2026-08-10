import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
  titleClassName?: string
  actionsClassName?: string
  titleTag?: 'h1' | 'h2' | 'h3'
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  actionsClassName,
  titleTag: TitleTag = 'h1',
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-2', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <TitleTag className={cn('text-2xl font-semibold', titleClassName)}>{title}</TitleTag>
        {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className={cn('flex shrink-0 flex-wrap items-center gap-2', actionsClassName)}>{actions}</div> : null}
    </div>
  )
}
