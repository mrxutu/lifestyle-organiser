import { NavLinks } from '@/components/nav/nav-links'
import { UserMenu } from '@/components/nav/user-menu'
import type { SectionFlags } from '@/lib/household-sections'

export function TopNav({
  user,
}: {
  user: { name: string | null; email: string; isAdmin?: boolean; sections: SectionFlags }
}) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-2 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-8">
          <span className="hidden text-sm font-semibold whitespace-nowrap lg:inline">Lifestyle Organiser</span>
          <div className="min-w-0 overflow-x-auto overscroll-x-contain">
            <NavLinks sections={user.sections} />
          </div>
        </div>
        <UserMenu name={user.name} email={user.email} isAdmin={user.isAdmin} />
      </div>
    </header>
  )
}
