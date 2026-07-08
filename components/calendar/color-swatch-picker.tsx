'use client'

import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EVENT_TYPE_COLORS } from '@/lib/event-type-colors'

export function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
      {EVENT_TYPE_COLORS.map((color) => {
        const selected = color.value === value
        return (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color.label}
            title={color.label}
            onClick={() => onChange(color.value)}
            className={cn(
              'flex size-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-shadow',
              selected ? 'ring-foreground' : 'ring-transparent'
            )}
            style={{ backgroundColor: color.value }}
          >
            {selected && <CheckIcon className="size-3.5 text-white" />}
          </button>
        )
      })}
    </div>
  )
}
