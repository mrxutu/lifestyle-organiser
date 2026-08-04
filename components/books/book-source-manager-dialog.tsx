'use client'

import { useState } from 'react'
import type { BookSource } from '@/generated/prisma/client'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { BookSourceManager } from '@/components/books/book-source-manager'

export function BookSourceManagerDialog({ sources }: { sources: BookSource[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Manage sources
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Manage sources">
        <BookSourceManager sources={sources} />
      </ResponsiveDialog>
    </>
  )
}
