'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BookOpen, Calendar, ChefHat, Tv, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionFlags } from '@/lib/household-sections'

const links: { href: string; label: string; section: keyof SectionFlags; icon: LucideIcon }[] = [
  { href: '/reminders', label: 'Reminders', section: 'calendar', icon: Bell },
  { href: '/calendar', label: 'Calendar', section: 'calendar', icon: Calendar },
  { href: '/recipes', label: 'Recipes', section: 'recipes', icon: ChefHat },
  { href: '/watchlist', label: 'Watchlist', section: 'watchlist', icon: Tv },
  { href: '/books', label: 'Books', section: 'books', icon: BookOpen },
]

export function NavLinks({ sections }: { sections: SectionFlags }) {
  const pathname = usePathname()
  const visibleLinks = links.filter((link) => sections[link.section])

  return (
    <nav className="flex w-max items-center gap-1 lg:gap-6">
      {visibleLinks.map((link) => {
        const isActive = pathname.startsWith(link.href)
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={link.label}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors hover:bg-muted lg:size-auto lg:justify-start lg:hover:bg-transparent',
              isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-5 shrink-0 lg:size-4" />
            <span className="hidden lg:inline">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
