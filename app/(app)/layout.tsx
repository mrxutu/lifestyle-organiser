import { TopNav } from '@/components/nav/top-nav'
import { getCurrentUser } from '@/lib/current-user'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={{ name: user.name, email: user.email, image: user.image }} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
