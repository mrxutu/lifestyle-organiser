'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/reminders', label: 'Reminders' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/books', label: 'Books' },
]

export function NavLinks({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const allLinks = isAdmin ? [...links, { href: '/admin', label: 'Admin' }] : links

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
