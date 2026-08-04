import { NavLinks } from '@/components/nav/nav-links'
import { UserMenu } from '@/components/nav/user-menu'
import { ThemeToggle } from '@/components/nav/theme-toggle'
import type { SectionFlags } from '@/lib/household-sections'

export function TopNav({
  user,
}: {
  user: { name: string | null; email: string; isAdmin?: boolean; sections: SectionFlags }
}) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          <span className="hidden text-sm font-semibold whitespace-nowrap lg:inline">Lifestyle Organiser</span>
          <NavLinks isAdmin={user.isAdmin} sections={user.sections} />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu name={user.name} email={user.email} />
        </div>
      </div>
    </header>
  )
}
