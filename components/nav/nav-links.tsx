'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { SectionFlags } from '@/lib/household-sections'

const links: { href: string; label: string; section: keyof SectionFlags }[] = [
  { href: '/reminders', label: 'Reminders', section: 'calendar' },
  { href: '/calendar', label: 'Calendar', section: 'calendar' },
  { href: '/recipes', label: 'Recipes', section: 'recipes' },
  { href: '/watchlist', label: 'Watchlist', section: 'watchlist' },
  { href: '/books', label: 'Books', section: 'books' },
]

export function NavLinks({ isAdmin, sections }: { isAdmin?: boolean; sections: SectionFlags }) {
  const pathname = usePathname()
  const visibleLinks = links.filter((link) => sections[link.section])
  const allLinks = isAdmin ? [...visibleLinks, { href: '/admin', label: 'Admin' }] : visibleLinks

  return (
    <nav className="flex items-center gap-4 sm:gap-6">
      {allLinks.map((link) => {
        const isActive = pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'text-sm transition-colors',
              isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
