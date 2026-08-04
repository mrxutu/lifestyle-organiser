'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BookOpen, Calendar, ChefHat, Shield, Tv, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionFlags } from '@/lib/household-sections'

const links: { href: string; label: string; section: keyof SectionFlags; icon: LucideIcon }[] = [
  { href: '/reminders', label: 'Reminders', section: 'calendar', icon: Bell },
  { href: '/calendar', label: 'Calendar', section: 'calendar', icon: Calendar },
  { href: '/recipes', label: 'Recipes', section: 'recipes', icon: ChefHat },
  { href: '/watchlist', label: 'Watchlist', section: 'watchlist', icon: Tv },
  { href: '/books', label: 'Books', section: 'books', icon: BookOpen },
]

export function NavLinks({ isAdmin, sections }: { isAdmin?: boolean; sections: SectionFlags }) {
  const pathname = usePathname()
  const visibleLinks = links.filter((link) => sections[link.section])
  const allLinks = isAdmin
    ? [...visibleLinks, { href: '/admin', label: 'Admin', icon: Shield }]
    : visibleLinks

  return (
    <nav className="flex items-center gap-3 lg:gap-6">
      {allLinks.map((link) => {
        const isActive = pathname.startsWith(link.href)
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={link.label}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden lg:inline">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
